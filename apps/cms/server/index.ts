import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import contentRoutes from './routes/content.js';
import appsRoutes from './routes/apps.js';
import imagesRoutes from './routes/images.js';

const app = express();
const PORT = 3010;

// Get current directory in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002', 'http://localhost:3003'],
  credentials: true,
}));

app.use(express.json());

// Routes
app.use('/api/content', contentRoutes);
app.use('/api', appsRoutes);
app.use('/api/images', imagesRoutes);

// Serve static images from data/images directory (at monorepo root)
const imagesPath = path.join(__dirname, '../../../data/images');
app.use('/data/images', express.static(imagesPath));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Server error:', err);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`CMS server running on http://localhost:${PORT}`);
  console.log(`- Health check: http://localhost:${PORT}/health`);
  console.log(`- Apps config: http://localhost:${PORT}/api/apps`);
  console.log(`- Content API: http://localhost:${PORT}/api/content/:filename`);
  console.log(`- Image upload: http://localhost:${PORT}/api/images`);
  console.log(`- Static images: http://localhost:${PORT}/data/images/`);
});
