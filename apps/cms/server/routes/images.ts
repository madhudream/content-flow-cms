import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const router = Router();

// Get current directory in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Store in data/images/ directory
    const uploadDir = path.join(__dirname, '../../../data/images');
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename: {appId}-{contentId}-{timestamp}.{ext}
    const { appId, contentId } = req.body;
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    const filename = `${appId}-${contentId}-${timestamp}${ext}`;
    cb(null, filename);
  },
});

// File filter to allow only images
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/svg+xml', 'image/webp'];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, GIF, SVG, and WebP images are allowed.'));
  }
};

// Configure multer
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

/**
 * POST /api/images
 * Upload an image file
 * 
 * Body (multipart/form-data):
 *   - image: file (required)
 *   - appId: string (required)
 *   - contentId: string (required)
 * 
 * Response:
 *   { path: "/data/images/demo-hero-123456789.jpg" }
 */
router.post('/', upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { appId, contentId } = req.body;

    if (!appId || !contentId) {
      // Delete the uploaded file if missing required fields
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: 'appId and contentId are required' });
    }

    // Return the path relative to the data directory
    const imagePath = `/data/images/${req.file.filename}`;
    
    console.log(`[CMS Server] Image uploaded: ${imagePath}`);
    
    res.json({ path: imagePath });
  } catch (error) {
    console.error('[CMS Server] Image upload error:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Image upload failed' });
  }
});

// Error handling middleware for multer errors
router.use((error: any, req: any, res: any, next: any) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ error: 'File too large. Maximum size is 5MB.' });
    }
    return res.status(400).json({ error: error.message });
  }
  
  if (error) {
    return res.status(400).json({ error: error.message });
  }
  
  next();
});

export default router;
