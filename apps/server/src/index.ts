import { config, validateConfig } from './config';
import { logger } from './utils/logger';
import contentRoutes from './routes/content';
import appsRoutes from './routes/apps';
import imagesRoutes from './routes/images';
import translateRoutes from './routes/translate';
import costsRoutes from './routes/costs';
import { file } from 'bun';
import { join } from 'path';

// Validate configuration on startup
try {
  validateConfig();
} catch (error) {
  console.error('Configuration error:', error);
  process.exit(1);
}

// Content-Type helper based on file extension
function getContentType(filePath: string): string | null {
  const ext = filePath.split('.').pop()?.toLowerCase();
  const contentTypes: Record<string, string> = {
    'html': 'text/html',
    'css': 'text/css',
    'js': 'application/javascript',
    'json': 'application/json',
    'png': 'image/png',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'gif': 'image/gif',
    'svg': 'image/svg+xml',
    'ico': 'image/x-icon',
    'woff': 'font/woff',
    'woff2': 'font/woff2',
    'ttf': 'font/ttf',
    'eot': 'application/vnd.ms-fontobject',
    'otf': 'font/otf',
    'webp': 'image/webp',
    'mp4': 'video/mp4',
    'webm': 'video/webm',
    'mp3': 'audio/mpeg',
    'wav': 'audio/wav',
    'pdf': 'application/pdf',
    'txt': 'text/plain',
    'xml': 'application/xml',
  };
  return ext ? contentTypes[ext] || null : null;
}

// CORS headers helper
function getCorsHeaders(origin?: string): Record<string, string> {
  const allowedOrigins = config.nodeEnv === 'development' 
    ? ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002', 'http://localhost:3003', 'http://localhost:8080']
    : []; // Add production domains here
  
  const headers: Record<string, string> = {
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
  };
  
  if (origin && allowedOrigins.includes(origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
    headers['Access-Control-Allow-Credentials'] = 'true';
  } else if (config.nodeEnv === 'development') {
    headers['Access-Control-Allow-Origin'] = '*';
  }
  
  return headers;
}

// Main server
const server = Bun.serve({
  port: config.port,
  
  async fetch(req) {
    const url = new URL(req.url);
    const origin = req.headers.get('origin') || undefined;
    const corsHeaders = getCorsHeaders(origin);
    
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: corsHeaders,
      });
    }
    
    try {
      // Health check
      if (url.pathname === '/health') {
        return new Response(
          JSON.stringify({
            status: 'ok',
            timestamp: new Date().toISOString(),
            environment: config.nodeEnv,
            storageType: config.storageType,
          }),
          {
            status: 200,
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders,
            },
          }
        );
      }
      
      // API Routes
      if (url.pathname.startsWith('/api/content')) {
        return await contentRoutes(req, corsHeaders);
      }
      if (url.pathname.startsWith('/api/apps')) {
        return await appsRoutes(req, corsHeaders);
      }
      if (url.pathname.startsWith('/api/images')) {
        return await imagesRoutes(req, corsHeaders);
      }
      if (url.pathname.startsWith('/api/translate')) {
        return await translateRoutes(req, corsHeaders);
      }
      if (url.pathname.startsWith('/api/costs')) {
        return await costsRoutes(req, corsHeaders);
      }
      
      // Storage config endpoint - returns blob storage base URL
      if (url.pathname === '/api/config') {
        const blobStorageBaseUrl = process.env.BLOB_STORAGE_BASE_URL || '';
        return new Response(
          JSON.stringify({
            storageType: config.storageType,
            blobStorageBaseUrl,
            contentUrl: config.storageType === 'azure' ? blobStorageBaseUrl : '/data',
          }),
          {
            status: 200,
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders,
            },
          }
        );
      }
      
      // Serve images
      if (url.pathname.startsWith('/data/images/')) {
        const imageName = url.pathname.replace('/data/images/', '');
        
        // If using Azure storage, redirect to blob storage
        if (config.storageType === 'azure') {
          const blobStorageBaseUrl = process.env.BLOB_STORAGE_BASE_URL || '';
          if (blobStorageBaseUrl) {
            const blobImageUrl = `${blobStorageBaseUrl}/images/${imageName}`;
            return Response.redirect(blobImageUrl, 302);
          }
        }
        
        // Otherwise serve from local filesystem
        const imagePath = join(config.imagesDir, imageName);
        const imageFile = file(imagePath);
        if (await imageFile.exists()) {
          return new Response(imageFile, { headers: corsHeaders });
        }
        return new Response('Image not found', { status: 404, headers: corsHeaders });
      }
      
      // Serve content JSON files (for SDK in consuming apps)
      if (url.pathname.startsWith('/data/') && url.pathname.endsWith('.json')) {
        const filename = url.pathname.replace('/data/', '');
        
        // If using Azure storage, redirect to blob storage
        if (config.storageType === 'azure') {
          const blobStorageBaseUrl = process.env.BLOB_STORAGE_BASE_URL || '';
          if (blobStorageBaseUrl) {
            const blobContentUrl = `${blobStorageBaseUrl}/content/${filename}`;
            return Response.redirect(blobContentUrl, 302);
          }
        }
        
        // Otherwise serve from local filesystem
        const contentPath = join(config.contentDir, filename);
        const contentFile = file(contentPath);
        if (await contentFile.exists()) {
          return new Response(contentFile, {
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json',
            },
          });
        }
        return new Response('Content not found', { status: 404, headers: corsHeaders });
      }
      
      // Serve static apps from public/ directory
      const appRoutes = ['/cms', '/bwo', '/demo', '/portal'];
      for (const route of appRoutes) {
        if (url.pathname === route || url.pathname.startsWith(`${route}/`)) {
          const appName = route.slice(1); // 'cms', 'bwo', 'demo', 'portal'
          
          // Determine the file path:
          // /cms -> cms/index.html
          // /cms/assets/file.js -> cms/assets/file.js
          let relativePath: string;
          if (url.pathname === route) {
            relativePath = join(appName, 'index.html');
          } else {
            // Remove the route prefix and join with app name
            const pathWithoutRoute = url.pathname.slice(route.length + 1); // +1 for the trailing slash
            relativePath = join(appName, pathWithoutRoute);
          }
          
          const fullPath = join(config.publicDir, relativePath);
          const staticFile = file(fullPath);
          
          if (await staticFile.exists()) {
            // Determine content type from extension
            const contentType = getContentType(relativePath);
            
            // Inject Google Analytics into HTML files
            if (relativePath.endsWith('.html')) {
              let htmlContent = await staticFile.text();
              
              // Google Analytics gtag script
              const gtagScript = `
<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-VF1X4MBK9R"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-VF1X4MBK9R');
</script>
`;
              
              // Inject before </head> or at the start of <body> if no </head>
              if (htmlContent.includes('</head>')) {
                htmlContent = htmlContent.replace('</head>', `${gtagScript}</head>`);
              } else if (htmlContent.includes('<body')) {
                htmlContent = htmlContent.replace('<body', `<body>${gtagScript}`);
              }
              
              return new Response(htmlContent, {
                headers: {
                  ...corsHeaders,
                  'Content-Type': 'text/html',
                },
              });
            }
            
            return new Response(staticFile, {
              headers: {
                ...corsHeaders,
                ...(contentType && { 'Content-Type': contentType }),
              },
            });
          }
          
          // SPA fallback: serve index.html for any unmatched routes within the app
          const indexPath = join(config.publicDir, appName, 'index.html');
          const indexFile = file(indexPath);
          if (await indexFile.exists()) {
            let htmlContent = await indexFile.text();
            
            // Google Analytics gtag script
            const gtagScript = `
<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-VF1X4MBK9R"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-VF1X4MBK9R');
</script>
`;
            
            // Inject before </head> or at the start of <body> if no </head>
            if (htmlContent.includes('</head>')) {
              htmlContent = htmlContent.replace('</head>', `${gtagScript}</head>`);
            } else if (htmlContent.includes('<body')) {
              htmlContent = htmlContent.replace('<body', `<body>${gtagScript}`);
            }
            
            return new Response(htmlContent, {
              headers: {
                ...corsHeaders,
                'Content-Type': 'text/html',
              },
            });
          }
          
          return new Response(
            `App "${appName}" not built yet. Run: npm run build:deploy`,
            {
              status: 404,
              headers: {
                ...corsHeaders,
                'Content-Type': 'text/plain',
              },
            }
          );
        }
      }
      
      // Root redirect to CMS
      if (url.pathname === '/') {
        return new Response(null, {
          status: 302,
          headers: {
            Location: '/cms',
            ...corsHeaders,
          },
        });
      }
      
      // 404 for everything else
      return new Response(
        JSON.stringify({ error: 'Not Found', path: url.pathname }),
        {
          status: 404,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        }
      );
      
    } catch (error) {
      logger.error('Request error', { error, path: url.pathname });
      return new Response(
        JSON.stringify({ error: 'Internal Server Error', message: error instanceof Error ? error.message : 'Unknown error' }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        }
      );
    }
  },
  
  error(error) {
    logger.error('Server error', { error });
    return new Response(
      JSON.stringify({ error: 'Internal Server Error' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  },
});

logger.info(`🚀 ContentFlow Unified Server`);
logger.info(`   Port: http://localhost:${server.port}`);
logger.info(`   Environment: ${config.nodeEnv}`);
logger.info(`   Storage: ${config.storageType}`);
logger.info(`   📁 Content: ${config.contentDir}`);
logger.info(`   🖼️  Images: ${config.imagesDir}`);
logger.info(`   ⚙️  Config: ${config.configDir}`);
logger.info(`   📦 Public: ${config.publicDir}`);
logger.info('');
logger.info('📱 Apps:');
logger.info('   CMS Portal:        http://localhost:' + server.port + '/cms');
logger.info('   BWO Tax Forms:     http://localhost:' + server.port + '/bwo');
logger.info('   Demo App:          http://localhost:' + server.port + '/demo');
logger.info('   Customer Portal:   http://localhost:' + server.port + '/portal');
logger.info('');
logger.info('🔌 API Endpoints:');
logger.info('   Health:            http://localhost:' + server.port + '/health');
logger.info('   Storage Config:    http://localhost:' + server.port + '/api/config');
logger.info('   Translation API:   http://localhost:' + server.port + '/api/translate/bulk');
logger.info('   Apps Config:       http://localhost:' + server.port + '/api/apps');
logger.info('   Content API:       http://localhost:' + server.port + '/api/content/:filename');
logger.info('   Image Upload:      http://localhost:' + server.port + '/api/images');
logger.info('');
logger.info('💡 Tip: Build apps first with: npm run build:all');
logger.info('');
