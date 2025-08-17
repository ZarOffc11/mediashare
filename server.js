require('dotenv').config();
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const app = express();
const port = process.env.PORT || 3000;

// Create uploads directory if it doesn't exist
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const randomId = generateRandomId();
    cb(null, `${randomId}${ext}`);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 100 * 1024 * 1024 } // 100MB limit
});

// Serve static files
app.use(express.static('public'));

// Handle root path
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API Endpoints
app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const ext = path.extname(req.file.originalname).toLowerCase();
  const randomId = path.basename(req.file.filename, ext);
  
  let urlPath;
  if (['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext)) {
    urlPath = `/i/${randomId}${ext}`;
  } else if (['.mp4', '.webm', '.mov', '.avi'].includes(ext)) {
    urlPath = `/v/${randomId}${ext}`;
  } else {
    urlPath = `/f/${randomId}${ext}`;
  }

  const fullUrl = `${req.protocol}://${req.get('host')}${urlPath}`;

  res.json({
    success: true,
    url: fullUrl,
    type: req.file.mimetype,
    originalName: req.file.originalname
  });
});

// File serving endpoints
app.get('/i/:id', (req, res) => {
  serveFile(req, res, 'image');
});

app.get('/v/:id', (req, res) => {
  serveFile(req, res, 'video');
});

app.get('/f/:id', (req, res) => {
  serveFile(req, res, 'file');
});

function serveFile(req, res, type) {
  const fileId = req.params.id;
  const filePath = path.join(__dirname, 'uploads', fileId);

  if (!fs.existsSync(filePath)) {
    return res.status(404).send('File not found');
  }

  // Set appropriate headers
  res.sendFile(filePath);
}

function generateRandomId() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return result;
}

// Start server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
