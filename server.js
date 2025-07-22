// server.js
import express from 'express';
import multer from 'multer';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3002;

// Enable CORS for all routes
app.use(cors());
app.use(express.json());

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept common document types
    const allowedTypes = /\.(csv|json|txt|xlsx|xls|pdf|docx)$/i;
    if (allowedTypes.test(file.originalname)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only CSV, JSON, TXT, XLSX, XLS, PDF, and DOCX files are allowed.'));
    }
  }
});

// File upload endpoint
app.post('/datasets', upload.fields([
  { name: 'datasetFile', maxCount: 1 },
  { name: 'testFile', maxCount: 1 }
]), (req, res) => {
  try {
    const { datasetName, testType, description } = req.body;
    const files = req.files;

    // Validate required fields
    if (!datasetName || !files?.datasetFile) {
      return res.status(400).json({
        error: 'Missing required fields: datasetName and datasetFile are required'
      });
    }

    // Create dataset record
    const dataset = {
      id: Date.now().toString(),
      name: datasetName,
      type: testType,
      description: description || '',
      createdAt: new Date().toISOString(),
      files: {
        dataset: {
          originalName: files.datasetFile[0].originalname,
          filename: files.datasetFile[0].filename,
          size: files.datasetFile[0].size,
          path: files.datasetFile[0].path
        }
      }
    };

    // Add test file info if provided
    if (files.testFile) {
      dataset.files.test = {
        originalName: files.testFile[0].originalname,
        filename: files.testFile[0].filename,
        size: files.testFile[0].size,
        path: files.testFile[0].path
      };
    }

    // Save dataset metadata to JSON file
    const datasetsFile = path.join(__dirname, 'db.json');
    let db = { datasets: [] };
    
    if (fs.existsSync(datasetsFile)) {
      const rawData = fs.readFileSync(datasetsFile);
      db = JSON.parse(rawData);
    }

    if (!db.datasets) {
      db.datasets = [];
    }

    db.datasets.push(dataset);
    fs.writeFileSync(datasetsFile, JSON.stringify(db, null, 2));

    console.log('Dataset uploaded successfully:', dataset);
    res.json({
      success: true,
      message: 'Dataset uploaded successfully',
      dataset: dataset
    });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      error: 'Failed to upload dataset',
      details: error.message
    });
  }
});

// Get all datasets
app.get('/datasets', (req, res) => {
  try {
    const datasetsFile = path.join(__dirname, 'db.json');
    if (fs.existsSync(datasetsFile)) {
      const rawData = fs.readFileSync(datasetsFile);
      const db = JSON.parse(rawData);
      res.json(db.datasets || []);
    } else {
      res.json([]);
    }
  } catch (error) {
    console.error('Error fetching datasets:', error);
    res.status(500).json({ error: 'Failed to fetch datasets' });
  }
});

// Download file endpoint
app.get('/datasets/:id/files/:type', (req, res) => {
  try {
    const { id, type } = req.params;
    const datasetsFile = path.join(__dirname, 'db.json');
    
    if (!fs.existsSync(datasetsFile)) {
      return res.status(404).json({ error: 'Dataset not found' });
    }

    const rawData = fs.readFileSync(datasetsFile);
    const db = JSON.parse(rawData);
    const dataset = db.datasets?.find(d => d.id === id);

    if (!dataset || !dataset.files[type]) {
      return res.status(404).json({ error: 'File not found' });
    }

    const filePath = dataset.files[type].path;
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Physical file not found' });
    }

    res.download(filePath, dataset.files[type].originalName);
  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ error: 'Failed to download file' });
  }
});

// Serve static files from uploads directory
app.use('/uploads', express.static(uploadsDir));

// Add your existing JSON Server routes here
// You can integrate with json-server or add your other endpoints

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Uploads directory: ${uploadsDir}`);
});

export default app;