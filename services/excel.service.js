"use strict";

const XLSX = require("xlsx");
const fs = require("fs");
const path = require("path");

const RESULTS_DIR = "storage/results";
if (!fs.existsSync(RESULTS_DIR)) fs.mkdirSync(RESULTS_DIR, { recursive: true });

// Eski fayllarni tozalash (1 soat)
setInterval(
	() => {
		if (!fs.existsSync(RESULTS_DIR)) return;
		fs.readdirSync(RESULTS_DIR).forEach((file) => {
			const fp = path.join(RESULTS_DIR, file);
			const age = Date.now() - fs.statSync(fp).mtimeMs;
			if (age > 60 * 60 * 1000) fs.unlink(fp, () => {});
		});
	},
	30 * 60 * 1000,
);

function readExcel(filePath) {
	const workbook = XLSX.readFile(filePath);
	const sheet = workbook.Sheets[workbook.SheetNames[0]];
	return XLSX.utils.sheet_to_json(sheet);
}

function writeExcel({ userId, yangiFuqarolar, xatoFuqarolar }) {
	const outBook = XLSX.utils.book_new();

	if (yangiFuqarolar.length > 0)
		XLSX.utils.book_append_sheet(
			outBook,
			XLSX.utils.json_to_sheet(yangiFuqarolar),
			process.env.SHEET_NAME || "YANGI_FUQAROLAR",
		);

	if (yangiFuqarolar.length === 0 && xatoFuqarolar.length === 0)
		XLSX.utils.book_append_sheet(
			outBook,
			XLSX.utils.json_to_sheet([{ HOLAT: "Hech narsa topilmadi" }]),
			"NATIJA",
		);

	const fileName = `natija_${userId}_${Date.now()}.xlsx`;
	const outputPath = path.join(RESULTS_DIR, fileName);
	XLSX.writeFile(outBook, outputPath);

	return `/results/${fileName}`;
}

module.exports = { readExcel, writeExcel };
