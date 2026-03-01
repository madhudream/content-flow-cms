import * as pulumi from "@pulumi/pulumi";
import * as resources from "@pulumi/azure-native/resources";
import * as storage from "@pulumi/azure-native/storage";
import * as containerregistry from "@pulumi/azure-native/containerregistry";
import * as app from "@pulumi/azure-native/app";
import * as web from "@pulumi/azure-native/web";
import * as docker from "@pulumi/docker";
import * as fs from "fs";
import * as path from "path";

// Helper function to recursively walk directory
function* walkDir(dir: string): Generator<string> {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      yield* walkDir(filePath);
    } else {
      yield filePath;
    }
  }
}

// Get configuration
const config = new pulumi.Config();
const location = config.get("location") || "eastus";
const imageName = config.get("imageName") || "contentflow-cms";
const registryName = config.get("registryName") || "contentflowcr";
const uploadContent = config.getBoolean("uploadContent") ?? true; // Set to false to skip content/image uploads

// Create an Azure Resource Group
const resourceGroup = new resources.ResourceGroup("contentflow-rg", {
    location: location,
    resourceGroupName: "contentflow-rg",
});

// Create an Azure Storage Account
const storageAccount = new storage.StorageAccount("contentflowstorage", {
    resourceGroupName: resourceGroup.name,
    accountName: "contentflowstorage",
    location: resourceGroup.location,
    sku: {
        name: storage.SkuName.Standard_LRS,
    },
    kind: storage.Kind.StorageV2,
    allowBlobPublicAccess: true,
    enableHttpsTrafficOnly: true,
});

// Get storage account keys
const storageAccountKeys = pulumi.all([resourceGroup.name, storageAccount.name]).apply(([rgName, saName]) =>
    storage.listStorageAccountKeys({
        resourceGroupName: rgName,
        accountName: saName,
    })
);

const primaryStorageKey = storageAccountKeys.apply(keys => keys.keys[0].value);

// Configure CORS for blob storage (allows browser access)
const blobServiceProperties = new storage.BlobServiceProperties("blob-service-properties", {
    resourceGroupName: resourceGroup.name,
    accountName: storageAccount.name,
    blobServicesName: "default",
    cors: {
        corsRules: [
            {
                allowedOrigins: ["*"], // Allow all origins (can restrict to specific domains in production)
                allowedMethods: ["GET", "HEAD", "OPTIONS"],
                allowedHeaders: ["*"],
                exposedHeaders: ["*"],
                maxAgeInSeconds: 3600, // Cache preflight requests for 1 hour
            },
        ],
    },
});

// Create blob container for content
const contentContainer = new storage.BlobContainer("contentflow-content", {
    resourceGroupName: resourceGroup.name,
    accountName: storageAccount.name,
    containerName: "contentflow-content",
    publicAccess: storage.PublicAccess.Blob, // Public read access for blobs
});

// Upload initial config file to blob storage (always upload config)
const appsConfigBlob = new storage.Blob("apps-config-blob", {
    resourceGroupName: resourceGroup.name,
    accountName: storageAccount.name,
    containerName: contentContainer.name,
    blobName: "config/apps.config.json",
    source: new pulumi.asset.FileAsset("../apps/server/config/apps.config.json"),
    contentType: "application/json",
});

// Upload all content JSON files to blob storage (recursively scan new folder structure)
// Set uploadContent=false in Pulumi config to skip this on updates
const contentDir = path.join(__dirname, "../apps/server/content");
const contentBlobs: storage.Blob[] = [];

if (uploadContent) {
    console.log("📤 Uploading content files and images to blob storage...");
    
    for (const filePath of walkDir(contentDir)) {
        const relativePath = path.relative(contentDir, filePath);
        
        // Skip translation-batches and costs directories
        if (relativePath.startsWith('translation-batches') || relativePath.startsWith('costs')) {
            continue;
        }
        
        // Only upload JSON and image files
        const ext = path.extname(filePath).toLowerCase();
        if (!['.json', '.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg'].includes(ext)) {
            continue;
        }
        
        // Determine content type
        let contentType = 'application/octet-stream';
        if (ext === '.json') {
            contentType = 'application/json';
        } else if (ext === '.jpg' || ext === '.jpeg') {
            contentType = 'image/jpeg';
        } else if (ext === '.png') {
            contentType = 'image/png';
        } else if (ext === '.webp') {
            contentType = 'image/webp';
        } else if (ext === '.gif') {
            contentType = 'image/gif';
        } else if (ext === '.svg') {
            contentType = 'image/svg+xml';
        }
        
        // Create blob with path preserved (e.g., content/demo/en-US/home.json or images/hero.jpg)
        const blobName = relativePath.replace(/\\/g, '/'); // Normalize path separators
        const resourceName = `content-${relativePath.replace(/[\/\\]/g, '-').replace(/\./g, '-')}`;
        
        const blob = new storage.Blob(resourceName, {
            resourceGroupName: resourceGroup.name,
            accountName: storageAccount.name,
            containerName: contentContainer.name,
            blobName: blobName,
            source: new pulumi.asset.FileAsset(filePath),
            contentType: contentType,
        });
        
        contentBlobs.push(blob);
    }
    
    console.log(`✅ Configured ${contentBlobs.length} content files for upload`);
} else {
    console.log("⏭️  Skipping content file uploads (uploadContent=false)");
}

// Create Azure Container Registry
const registry = new containerregistry.Registry("contentflowcr", {
    resourceGroupName: resourceGroup.name,
    registryName: registryName,
    location: resourceGroup.location,
    sku: {
        name: "Basic",
    },
    adminUserEnabled: true,
});

// Get registry credentials
const registryCreds = pulumi.all([resourceGroup.name, registry.name]).apply(([rgName, regName]) =>
    containerregistry.listRegistryCredentials({
        resourceGroupName: rgName,
        registryName: regName,
    })
);

const registryUsername = registryCreds.apply(creds => creds.username!);
const registryPassword = registryCreds.apply(creds => creds.passwords![0].value!);
const registryServer = registry.loginServer;

// Build and push Docker image
const image = new docker.Image("contentflow-image", {
    imageName: pulumi.interpolate`${registryServer}/${imageName}:latest`,
    build: {
        context: "../",  // Build from repo root
        dockerfile: "../apps/server/Dockerfile",  // Dockerfile path relative to context
        platform: "linux/amd64",
    },
    registry: {
        server: registryServer,
        username: registryUsername,
        password: registryPassword,
    },
});

// Create Container Apps Environment
const containerAppsEnvironment = new app.ManagedEnvironment("contentflow-env", {
    resourceGroupName: resourceGroup.name,
    environmentName: "contentflow-env",
    location: resourceGroup.location,
    workloadProfiles: [{
        name: "Consumption",
        workloadProfileType: "Consumption",
    }],
});

// Create Container App
const containerApp = new app.ContainerApp("contentflow-app", {
    resourceGroupName: resourceGroup.name,
    containerAppName: "contentflow-app",
    location: resourceGroup.location,
    managedEnvironmentId: containerAppsEnvironment.id,
    configuration: {
        ingress: {
            external: true,
            targetPort: 8080,
            transport: "http",
            allowInsecure: false,
        },
        registries: [{
            server: registryServer,
            username: registryUsername,
            passwordSecretRef: "registry-password",
        }],
        secrets: [
            {
                name: "registry-password",
                value: registryPassword,
            },
            {
                name: "azure-storage-key",
                value: primaryStorageKey,
            },
            {
                name: "openai-api-key",
                value: config.requireSecret("openaiApiKey"),
            },
        ],
    },
    template: {
        containers: [{
            name: "contentflow-cms",
            image: image.imageName,
            resources: {
                cpu: 0.25,
                memory: "0.5Gi",
            },
            env: [
                {
                    name: "NODE_ENV",
                    value: "production",
                },
                {
                    name: "PORT",
                    value: "8080",
                },
                {
                    name: "STORAGE_TYPE",
                    value: "azure",
                },
                {
                    name: "AZURE_STORAGE_ACCOUNT",
                    value: storageAccount.name,
                },
                {
                    name: "AZURE_STORAGE_KEY",
                    secretRef: "azure-storage-key",
                },
                {
                    name: "AZURE_STORAGE_CONTAINER",
                    value: "contentflow-content",
                },
                {
                    name: "BLOB_STORAGE_BASE_URL",
                    value: pulumi.interpolate`https://${storageAccount.name}.blob.core.windows.net/contentflow-content`,
                },
                {
                    name: "OPENAI_API_KEY",
                    secretRef: "openai-api-key",
                },
                {
                    name: "OPENAI_MODEL",
                    value: "gpt-5.1",
                },
                {
                    name: "OPENAI_TEMPERATURE",
                    value: "0.1",
                },
            ],
        }],
        scale: {
            minReplicas: 0, // Scale to zero when idle
            maxReplicas: 3,
            rules: [{
                name: "http-scaling",
                http: {
                    metadata: {
                        concurrentRequests: "10",
                    },
                },
            }],
        },
    },
});

// Image optimization now handled by Bun server with Sharp
// No separate Azure Function needed - saves $13/month for B1 plan
// Or avoids quota limitations for Consumption plan

// Exports
export const resourceGroupName = resourceGroup.name;
export const storageAccountName = storageAccount.name;
export const storageAccountKey = primaryStorageKey;
export const blobStorageUrl = pulumi.interpolate`https://${storageAccount.name}.blob.core.windows.net/${contentContainer.name}`;
export const containerRegistryName = registry.name;
export const containerRegistryServer = registryServer;
export const containerAppUrl = pulumi.interpolate`https://${containerApp.configuration.apply(c => c!.ingress!.fqdn!)}`;
