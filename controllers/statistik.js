const { db } = require("../db.js");
const jwt = require("jsonwebtoken");

const dbQuery = (query, params) => {
  return new Promise((resolve, reject) => {
    db.query(query, params, (err, result) => {
      if (err) {
        reject(err);
      } else {
        resolve(result);
      }
    });
  });
};

const getStatistikDB = async (id_barang) => {
  const q = `
    SELECT k.id, k.nama, kat.nama as kategori, k.harga, s.jumlah_klik, s.updated_at 
    FROM statistik as s 
    INNER JOIN katalog as k ON s.id_barang = k.id
    INNER JOIN kategori as kat ON k.kategori = kat.id
    ${id_barang ? "WHERE k.id = ?" : ""};
  `;
  return await dbQuery(q, id_barang ? [id_barang] : []);
};

const updateStatistikDB = async (values, id_barang) => {
  const q = "UPDATE statistik SET `jumlah_klik`=`jumlah_klik`+1, `updated_at`=NOW() WHERE `id_barang` = ?";
  return await dbQuery(q, [id_barang]);
};

const tambahStatistikDB = async (values) => {
  const q = "INSERT INTO statistik(`id_barang`, `jumlah_klik`, `updated_at`) VALUES (?)";
  return await dbQuery(q, [values]);
};

const getStatistikServe = async (req, res) => {
  try {
    const data = await getStatistikDB(req.params.id_barang);
    res.status(200).json(data);
  } catch (err) {
    res.status(500).send(err);
  }
};

const tambahStatistikServe = async (req, res) => {
  let token = req.headers.authorization;
  if (!token) return res.status(401).json('Not authenticated!');
  token = token.split('Bearer ')[1]

  jwt.verify(token, "jwtkey", async (err, userInfo) => {
    if (err) return res.status(403).json("Token is not valid!");

    const updated_at = new Date().toISOString().slice(0, 19).replace('T', ' ');
    const values = [
      req.body.id_barang,
      req.body.jumlah_klik,
      updated_at
    ];

    try {
      await tambahStatistikDB(values);
      return res.status(200).json(values);
    } catch (err) {
      return res.status(500).json(err);
    }
    
  });
};

const updateStatistikServe = async (req, res) => {
  try {
    let updateStatus = await updateStatistikDB(null, req.params.id_barang);
    if (updateStatus.affectedRows == 0) return res.status(404).json("Barang tidak ditemukan!");
    return res.status(200).json({ values: 'ok' });
  } catch (err) {
    console.log(err);
    return res.status(500).json(err);
  }
};

module.exports = {
  getStatistikServe,
  tambahStatistikServe,
  updateStatistikServe,
};
