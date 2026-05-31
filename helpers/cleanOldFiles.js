const fs = require("fs");
const path = require("path");
const RESULTS_DIR = "storage/results";
const MAX_AGE_MS = 60 * 60 * 1000; // 1 soat

module.exports = function cleanOldFiles() {
	if (!fs.existsSync(RESULTS_DIR)) return;
	const now = Date.now();
	fs.readdirSync(RESULTS_DIR).forEach((file) => {
		const filePath = path.join(RESULTS_DIR, file);
		const age = now - fs.statSync(filePath).mtimeMs;
		if (age > MAX_AGE_MS) {
			fs.unlink(filePath, () => {});
			console.log("🗑️  Eski fayl o'chirildi:", file);
		}
	});
}
