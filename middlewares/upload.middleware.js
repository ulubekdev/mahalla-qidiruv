const multer = require("multer");
const path = require("path");
const fs = require("fs");

if (!fs.existsSync("uploads")) {
	fs.mkdirSync("uploads");
}

const storage = multer.diskStorage({
	destination: (req, file, cb) => {
		cb(null, "uploads/");
	},

	filename: (req, file, cb) => {
		const unique = Date.now() + "-" + Math.random().toString(36).slice(2);

		cb(null, unique + path.extname(file.originalname));
	},
});

module.exports = multer({
	storage,

	fileFilter: (req, file, cb) => {
		const allowed =
			file.mimetype.includes("sheet") ||
			file.originalname.endsWith(".xlsx") ||
			file.originalname.endsWith(".xls");

		if (!allowed) {
			return cb(new Error("Faqat Excel fayl mumkin"));
		}

		cb(null, true);
	},
});
