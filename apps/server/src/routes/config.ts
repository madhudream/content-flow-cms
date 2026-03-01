/**
 * Configuration API Routes
 * Returns runtime configuration like blob storage URLs
 */

export default function registerConfigRoutes(app: any) {
  /**
   * GET /api/config
   * Returns configuration including blob storage base URL
   */
  app.get("/api/config", async (req: any) => {
    const storageType = process.env.STORAGE_TYPE || "local";
    const blobStorageBaseUrl = process.env.BLOB_STORAGE_BASE_URL || "";
    
    return Response.json({
      storageType,
      blobStorageBaseUrl,
      environment: process.env.NODE_ENV || "development",
    });
  });
}
