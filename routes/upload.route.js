const express = require("express");
const router = express.Router();

const upload = require("../middlewares/upload.middleware");
const validateExcel = require("../services/validateExcel.service.js");

router.post("/", upload.single("excel"), validateExcel);

module.exports = router;
