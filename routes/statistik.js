const express = require("express");
const multer = require("multer");

const {
  tambahStatistikServe,
  getStatistikServe,
  updateStatistikServe,
} = require("../controllers/statistik.js");

const router = express.Router();

router.get("/", getStatistikServe);
router.get("/:id_barang", getStatistikServe);
router.post("/", tambahStatistikServe);
router.put("/:id_barang", updateStatistikServe);

module.exports = router;

