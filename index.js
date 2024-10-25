const express = require('express');
const authRoutes = require('./routes/auth.js');
// const userRoutes = require('./routes/users.js');
const postRoutes = require('./routes/posts.js');
const statsRoutes = require('./routes/statistik.js');
const cookieParser = require('cookie-parser');
const multer = require('multer');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const app = express();

// app.use(
//   cors({
//     origin: ['http://localhost:3000', 'http://localhost:1337',"https://pardijayamotor.com","https://dashboard.pardijayamotor.com"],
//     credentials: true,
//   })
// );
require('dotenv/config');

app.use(cors())
app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json({ limit: '5mb' }));
app.use(bodyParser.urlencoded({ limit: '5mb', extended: true }));
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const outputPath = path.join(__dirname, `${process.env.IMAGEFOLDER}`);
    cb(null, outputPath);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + file.originalname);
  },
});

const imageFilter = function (req, file, cb) {
  if (!file.mimetype.match(/^image\//)) {
    return cb(new Error('Only image files are allowed!'), false);
  }
  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter: imageFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB 
  },
});

app.post("/api/upload", upload.single("file"), function (req, res) {
  const file = req.file;
  res.status(200).json(file.filename);
});

app.get('/',(req,res)=>{
  res.send("ON")
})
app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/statistik', statsRoutes);


app.listen(8800, () => {
  console.log('Server Connected! 8800');
});
