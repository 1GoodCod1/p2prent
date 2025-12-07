import multer from 'multer';
import path from 'path';
import fs from 'fs';
import sharp from 'sharp';

// Ensure upload directory exists
const uploadDir = path.join(process.cwd(), '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

export const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only images are allowed'));
  }
};

export const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: fileFilter,
});

export const processImage = async (filePath, options = {}) => {
  const { width = 1200, height = 800, quality = 80 } = options;
  const processedPath = filePath.replace(path.extname(filePath), '-processed.jpg');

  await sharp(filePath)
    .resize(width, height, { fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality })
    .toFile(processedPath);

  // Delete original file
  fs.unlinkSync(filePath);

  return processedPath;
};

export const createThumbnail = async (filePath, options = {}) => {
  const { width = 300, height = 200 } = options;
  const thumbnailPath = filePath.replace(path.extname(filePath), '-thumbnail.jpg');

  await sharp(filePath)
    .resize(width, height, { fit: 'cover' })
    .jpeg({ quality: 70 })
    .toFile(thumbnailPath);

  return thumbnailPath;
};