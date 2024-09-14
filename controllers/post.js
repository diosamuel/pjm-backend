const { db } = require('../db.js');
const jwt = require('jsonwebtoken');
const sharp = require('sharp');
const jose = require('jose');
require('dotenv/config');
const fs = require('fs');
const path = require('path');

let secret = new TextEncoder().encode(process.env.JWT_KEY);

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

const getSemuaKatalogDB = async (kategori) => {
  let q =
    'SELECT k.* AS kategori FROM katalog k INNER JOIN kategori kat ON k.kategori = kat.id';
  if (kategori) {
    q = q + ' WHERE kat.nama = ?;';
  }
  return await dbQuery(q, [kategori]);
};

const getKatalogIdDB = async (id) => {
  const q =
    'SELECT k.* AS kategori FROM katalog k INNER JOIN kategori kat ON k.kategori = kat.id WHERE k.id = ?';
  return await dbQuery(q, [id]);
};

const tambahKatalogDB = async (values) => {
  const q = await dbQuery(
    'INSERT INTO katalog(`nama`, `deskripsi`, `img`, `img2`,`img3`,`img4`,`img5`, `kategori`,`stok`,`harga`,`diskon`, `warna`,`berat`,`lazada`,`shopee`,`tokopedia`,`created_at`) VALUES (?)',
    [values]
  );
  return q;
};

const hapusKatalogDB = async (id) => {
  await dbQuery('SET FOREIGN_KEY_CHECKS = 0');
  await dbQuery('DELETE FROM statistik where id_barang = ?;', [id]);
  let q = await dbQuery('DELETE FROM katalog WHERE `id` = ?', [id]);
  await dbQuery('SET FOREIGN_KEY_CHECKS = 1');
  return q;
};

const updateKatalogDB = async (values, id) => {
  const q =
    'UPDATE katalog SET `nama`=?,`deskripsi`=?,`img`=?,`img2`=?,`img3`=?,`img4`=?,`img5`=?,`kategori`=?,`stok`=?,`harga`=?,`diskon`=?,`warna`=?,`berat`=?,`lazada`=?,`shopee`=?,`tokopedia`=?,`updated_at`=? WHERE `id` = ?';
  return await dbQuery(q, [...values, id]);
};

function groupingImages(data) {
  let { img, img2, img3, img4, img5, ...datas } = data;
  datas.images = [img, img2, img3, img4, img5].filter(Boolean);
  return datas;
}

async function getSemuaKatalogServe(req, res) {
  try {
    const data = await getSemuaKatalogDB(req.query.kategori);
    let newData = data.map((dat) => groupingImages(dat));
    res.status(200).json(newData);
  } catch (err) {
    res.status(500).send(err);
  }
}

async function getKatalogIdServe(req, res) {
  try {
    let data = await getKatalogIdDB(req.params.id);
    if (data.length === 0) {
      return res.status(404).json({});
    } else {
      let newData = groupingImages(data[0]);
      return res.status(200).json(newData);
    }
  } catch (err) {
    return res.status(500).json(err);
  }
}

async function getKatalogKategoriServe(req, res) {
  try {
    let data = await getSemuaKatalogDB(req.params.kategori);
    if (data.length === 0) {
      return res.status(404).json({});
    } else {
      let newData = data.map((datas) => groupingImages(datas));
      return res.status(200).json(newData);
    }
  } catch (err) {
    return res.status(500).json(err);
  }
}

async function tambahKatalogServe(req, res) {
  let token = req.headers.authorization;
  if (!token) return res.status(401).json('Not authenticated!');
  token = token.split('Bearer ')[1]
  const { payload } = await jose.jwtVerify(token, secret);
  if (payload) {
    const files = req.files;

    let imageFiles = files.map((x) => `compress_${x.filename}`);
    if (imageFiles.length < 5) {
      imageFiles = [...imageFiles, ...new Array(5 - imageFiles.length)];
    }

    const created_at = new Date().toISOString().slice(0, 19).replace('T', ' ');
    const values = [
      req.body.nama,
      req.body.deskripsi,
      ...imageFiles,
      req.body.kategori,
      req.body.stok,
      req.body.harga,
      req.body.diskon,
      req.body.warna,
      req.body.berat,
      req.body.lazada,
      req.body.shopee,
      req.body.tokopedia,
      created_at,
    ];

    try {
      await tambahKatalogDB(values);
      let [
        nama,
        deskripsi,
        img,
        img2,
        img3,
        img4,
        img5,
        kategori,
        stok,
        harga,
        warna,
        berat,
        lazada,
        shopee,
        tokopedia,
        created_at,
      ] = values;
      return res.status(200).json(
        groupingImages({
          nama,
          deskripsi,
          img,
          img2,
          img3,
          img4,
          img5,
          kategori,
          stok,
          harga,
          warna,
          berat,
          lazada,
          shopee,
          tokopedia,
          created_at,
        })
      );
    } catch (err) {
      return res.status(500).json(err);
    }
  }
}

async function updateKatalogServe(req, res) {
  let token = req.headers.authorization;
  if (!token) return res.status(401).json('Not authenticated!');
  token = token.split('Bearer ')[1]

  const { payload } = await jose.jwtVerify(token, secret);
  if (payload) {
    // Delete previous images

    const barang = await getKatalogIdDB(req.params.id);
    const { img, img2, img3, img4 } = barang[0];
    const barangArray = [img, img2, img3, img4];

    barangArray.forEach((inputPath) => {
      if (inputPath) {
        const outputPath = path.join(__dirname, `/home/diosamue/public_html/images/${inputPath}`);

        setTimeout(async () => {
          if (fs.existsSync(outputPath)) {
            fs.unlinkSync(outputPath);
          } else {
            console.error(`File not found: ${outputPath}`);
          }
        }, 1000);
      }
    });

    const { files } = req;
    let imageFiles = files.map((file) => `compress_${file.filename}`);
    if (imageFiles.length < 5) {
      imageFiles = [...imageFiles, ...new Array(5 - imageFiles.length)];
    }

    const updated_at = new Date().toISOString().slice(0, 19).replace('T', ' ');
    const values = [
      req.body.nama,
      req.body.deskripsi,
      ...imageFiles,
      req.body.kategori,
      req.body.stok,
      req.body.harga,
      req.body.diskon,
      req.body.warna,
      req.body.berat,
      req.body.lazada,
      req.body.shopee,
      req.body.tokopedia,
      updated_at,
    ];

    try {
      let updateStatus = await updateKatalogDB(values, req.params.id);

      if (updateStatus.affectedRows === 0) {
        return res.status(404).json('Barang tidak ditemukan!');
      }
      let [
        nama,
        deskripsi,
        img,
        img2,
        img3,
        img4,
        img5,
        kategori,
        stok,
        harga,
        warna,
        berat,
        lazada,
        shopee,
        tokopedia,
        created_at,
      ] = values;
      return res.status(200).json(
        groupingImages({
          nama,
          deskripsi,
          img,
          img2,
          img3,
          img4,
          img5,
          kategori,
          stok,
          harga,
          lazada,
          shopee,
          tokopedia,
          created_at,
        })
      );
    } catch (err) {
      console.error('Error updating catalog:', err);
      return res.status(500).json(err);
    }
  }
}

async function hapusKatalogServe(req, res) {
  let token = req.headers.authorization;
  if (!token) return res.status(401).json('Not authenticated!');
  token = token.split('Bearer ')[1]

  const { payload } = await jose.jwtVerify(token, secret);
  if (payload) {
    try {
      const barang = await getKatalogIdDB(req.params.id);
      const { img, img2, img3, img4 } = barang[0];
      const barangArray = [img, img2, img3, img4];

      barangArray.forEach((inputPath) => {
        if (inputPath) {
          const outputPath = `./public/image/${inputPath}`;
          setTimeout(() => fs.unlinkSync(outputPath), 1000);
        }
      });

      const data = await hapusKatalogDB(req.params.id);
      if (data.affectedRows === 0) {
        return res.status(404).json('Barang tidak ditemukan');
      }
      return res.status(200).json(barang);
    } catch (err) {
      res.status(500).json('Error saat menghapus barang');
    }
  }
}

module.exports = {
  getSemuaKatalogServe,
  getKatalogIdServe,
  getKatalogKategoriServe,
  tambahKatalogServe,
  updateKatalogServe,
  hapusKatalogServe,
};
