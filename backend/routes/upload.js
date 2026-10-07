const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { authenticateToken } = require('./auth');

// Ensure uploads folder exists
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer Storage Configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const safeBaseName = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    const uniqueFileName = `${Date.now()}-${uuidv4().substring(0, 8)}-${safeBaseName}${ext}`;
    cb(null, uniqueFileName);
  }
});

// File Filter (Documents, Archives, Images)
const fileFilter = (req, file, cb) => {
  const allowedExtensions = ['.pdf', '.docx', '.doc', '.txt', '.pptx', '.ppt', '.xlsx', '.xls', '.zip', '.rar', '.png', '.jpg', '.jpeg', '.csv'];
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error(`File type ${ext} is not allowed. Supported formats: PDF, DOCX, DOC, TXT, PPTX, XLSX, ZIP, CSV, Images.`));
  }
};

// Multer Upload Middleware with strict 10 MB limit
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10 Megabytes limit
  },
  fileFilter: fileFilter
});

// POST /api/upload - Upload a document (Max 10MB)
router.post('/', authenticateToken, (req, res) => {
  upload.single('document')(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'File size exceeds maximum limit of 10 MB. Please upload a smaller file.' });
      }
      return res.status(400).json({ error: `Upload error: ${err.message}` });
    } else if (err) {
      return res.status(400).json({ error: err.message });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No document file provided for upload.' });
    }

    // Format human-readable file size
    const sizeInMB = (req.file.size / (1024 * 1024)).toFixed(2);
    const sizeFormatted = req.file.size < 1024 * 1024 
      ? `${(req.file.size / 1024).toFixed(1)} KB`
      : `${sizeInMB} MB`;

    // Static URL path to access uploaded file
    const fileUrl = `/uploads/${req.file.filename}`;

    res.json({
      message: 'Document uploaded successfully',
      file: {
        url: fileUrl,
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        sizeFormatted,
        mimetype: req.file.mimetype,
        uploadedAt: new Date().toISOString()
      }
    });
  });
});

module.exports = router;
