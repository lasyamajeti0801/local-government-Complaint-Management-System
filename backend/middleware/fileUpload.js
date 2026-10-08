// =============================================================
// NAGAR CONNECT — MEMBER 4
// backend/middleware/fileUpload.js
// Multer-based file upload middleware with strict security validation.
// Shared — can be used by M2 evidence endpoints too.
// =============================================================

const multer  = require('multer');
const path    = require('path');
const crypto  = require('crypto');
const fs      = require('fs');

// ─────────────────────────────────────────
// Allowed MIME types and extensions
// ─────────────────────────────────────────
const ALLOWED_IMAGE_MIMES = ['image/jpeg', 'image/png', 'image/webp'];
const ALLOWED_DOC_MIMES   = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
];
const ALL_ALLOWED_MIMES   = [...ALLOWED_IMAGE_MIMES, ...ALLOWED_DOC_MIMES];

const ALLOWED_EXTENSIONS  = ['.jpg', '.jpeg', '.png', '.webp', '.pdf', '.doc', '.docx', '.txt'];

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

// ─────────────────────────────────────────
// Storage — save to uploads/evidence/
// ─────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/evidence');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Randomize filename to prevent path traversal / guessing
    const randomName = crypto.randomBytes(16).toString('hex');
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${randomName}${ext}`);
  },
});

// ─────────────────────────────────────────
// File filter — validate MIME + extension
// ─────────────────────────────────────────
function fileFilter(req, file, cb) {
  const ext = path.extname(file.originalname).toLowerCase();

  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return cb(
      Object.assign(new Error(`File extension ${ext} not allowed.`), { code: 'INVALID_EXTENSION' }),
      false
    );
  }

  if (!ALL_ALLOWED_MIMES.includes(file.mimetype)) {
    return cb(
      Object.assign(new Error(`File type ${file.mimetype} not allowed.`), { code: 'INVALID_MIME' }),
      false
    );
  }

  cb(null, true);
}

// ─────────────────────────────────────────
// Multer instances
// ─────────────────────────────────────────

/** Single evidence file upload */
const uploadEvidence = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE_BYTES },
}).single('file');

/** Multiple evidence files (up to 5) */
const uploadMultipleEvidence = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE_BYTES },
}).array('files', 5);

// ─────────────────────────────────────────
// Wrapper — converts multer callback to Express middleware
// with proper error handling
// ─────────────────────────────────────────
function handleUpload(multerMiddleware) {
  return (req, res, next) => {
    multerMiddleware(req, res, (err) => {
      if (err) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(413).json({
            success: false,
            message: `File too large. Maximum allowed size is ${MAX_FILE_SIZE_BYTES / (1024 * 1024)} MB.`,
          });
        }
        if (err.code === 'INVALID_EXTENSION' || err.code === 'INVALID_MIME') {
          return res.status(415).json({ success: false, message: err.message });
        }
        return res.status(400).json({ success: false, message: err.message });
      }
      next();
    });
  };
}

module.exports = {
  uploadEvidence:         handleUpload(uploadEvidence),
  uploadMultipleEvidence: handleUpload(uploadMultipleEvidence),
  ALLOWED_IMAGE_MIMES,
  ALLOWED_DOC_MIMES,
  MAX_FILE_SIZE_BYTES,
};
