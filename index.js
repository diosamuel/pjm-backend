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

app.use(
  cors({
    origin: ['http://localhost:3000', 'http://localhost:1337',"https://pardijayamotor.com","https://dashboard.pardijayamotor.com"],
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json({ limit: '5mb' }));
app.use(bodyParser.urlencoded({ limit: '5mb', extended: true }));
// app.use((req, res, next) => {
//     res.header("Access-Control-Allow-Origin", "*");
//     res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
//     next();
// });
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, '/home/diosamue/public_html/images');
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
// app.use('/api/users', userRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/statistik', statsRoutes);


// app.use('/api/images', express.static('/home/diosamue/public_html/api/images'));
// app.get('/api/images/:imageName', (req, res) => {
//   const imageName = req.params.imageName;
//   const imagePath = path.join("/home/diosamue/public_html/api/images", imageName);

//   fs.access(imagePath, fs.constants.F_OK, (err) => {
//     if (err) {
//       return res.status(404).send('Image not found');
//     }
//     res.sendFile(imagePath);
//   });
// });

app.listen(8800, () => {
  console.log('Server Connected! 8800');
});
