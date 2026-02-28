import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const router = express.Router();

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// GET /api/apps - Serve apps.config.json
router.get('/apps', (req, res) => {
  try {
    const appsConfigPath = path.resolve(__dirname, '../../../../data/apps.config.json');
    console.log('Looking for apps config at:', appsConfigPath);
    console.log('File exists?', fs.existsSync(appsConfigPath));
    
    if (!fs.existsSync(appsConfigPath)) {
      return res.status(404).json({ error: 'Apps config not found' });
    }
    
    const data = fs.readFileSync(appsConfigPath, 'utf-8');
    const appsConfig = JSON.parse(data);
    
    res.json(appsConfig);
  } catch (error) {
    console.error('Error reading apps config:', error);
    res.status(500).json({ error: 'Failed to read apps config' });
  }
});

export default router;
