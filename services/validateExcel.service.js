const XLSX = require("xlsx");
const fs = require("fs");

module.exports = (req, res) => {
	try {
		if (!req.file) {
			return res.json({
				success: false,
				error: "Excel topilmadi",
			});
		}

		const workbook = XLSX.readFile(req.file.path, {
			cellText: false,
			cellDates: true,
		});

		if (!workbook.SheetNames.length) {
			fs.unlinkSync(req.file.path);

			return res.json({
				success: false,
				error: "Sheet topilmadi",
			});
		}

		const sheet = workbook.Sheets[workbook.SheetNames[0]];

		const rows = XLSX.utils.sheet_to_json(sheet, {
			header: 1,
			defval: "",
			raw: false,
		});

		let pinflFound = false;

		for (const row of rows) {
			for (const cell of row) {
				if (String(cell).trim().toUpperCase() === "PINFL") {
					pinflFound = true;
				}
			}
		}

		if (!pinflFound) {
			fs.unlinkSync(req.file.path);

			return res.json({
				success: false,
				error: "PINFL ustuni topilmadi",
			});
		}

		return res.json({
			success: true,
			filePath: req.file.path,
		});
	} catch (err) {
		if (req.file && fs.existsSync(req.file.path)) {
			fs.unlinkSync(req.file.path);
		}

		return res.json({
			success: false,
			error: err.message,
		});
	}
};
