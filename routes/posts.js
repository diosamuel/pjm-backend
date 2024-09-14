const express = require('express');
const multer = require('multer');
const fs = require('fs');
const sharp = require('sharp');
const {
  tambahKatalogServe,
  hapusKatalogServe,
  getKatalogIdServe,
  getSemuaKatalogServe,
  updateKatalogServe,
  getKatalogKategoriServe,
} = require('../controllers/post.js');

const router = express.Router();

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, '/home/diosamue/public_html/images');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + file.originalname);
  },
});

const upload = multer({ storage });

const compressImages = async (req, res, next) => {
  if (!req.files || req.files.length === 0) {
    return next();
  }

  try {
    const compressedFiles = await Promise.all(
      req.files.map(async (file) => {
        const inputPath = file.path;
        const outputPath = `/home/diosamue/public_html/images/compress_${file.filename}`;
        await sharp(inputPath).jpeg({ quality: 70 }).toFile(outputPath);

        setTimeout(()=>{
        fs.unlink(inputPath, (err) => {
          if (err) {
            console.error(`Error deleting file ${inputPath}:`, err);
          }
        });
        },500)

        return {
          ...file,
          path: outputPath,
          filename: `${file.filename}`, // Update the filename in the file object
        };
      })
    );
    req.files = compressedFiles;
    next();
  } catch (error) {
    next(error);
  }
};

router.get('/', getSemuaKatalogServe);
router.get('/:id', getKatalogIdServe);
router.get('/kategori/:kategori', getKatalogKategoriServe);
router.post('/', upload.array('img', 5), compressImages, tambahKatalogServe);
router.delete('/:id', hapusKatalogServe);
router.put('/:id', upload.array('img', 5), compressImages, updateKatalogServe);

module.exports = router;