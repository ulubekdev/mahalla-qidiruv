"use strict";

const fs = require("fs");
const path = require("path");
const axios = require("axios");

const TOKEN_DIR = "storage/auth";
const TWO_DAYS = 48 * 60 * 60 * 1000;

if (!fs.existsSync(TOKEN_DIR)) fs.mkdirSync(TOKEN_DIR, { recursive: true });

function tokenFile(userId) {
	return path.join(TOKEN_DIR, `token_${userId}.json`);
}

function saveToken(userId, token) {
	fs.writeFileSync(
		tokenFile(userId),
		JSON.stringify({
			token,
			savedAt: Date.now(),
		}),
	);
}

function getToken(userId) {
	const file = tokenFile(userId);
	if (!fs.existsSync(file)) return null;
	try {
		const { token, savedAt } = JSON.parse(fs.readFileSync(file, "utf-8"));
		if (Date.now() - savedAt > TWO_DAYS) return null;
		return token;
	} catch {
		return null;
	}
}

function deleteToken(userId) {
	const file = tokenFile(userId);
	if (fs.existsSync(file)) fs.unlinkSync(file);
}

// Token haqiqiy ekanligini API ga so'rov yuborib tekshirish
async function verifyToken(token) {
	try {
		await axios.post(
			`${process.env.API_BASE}/citizen/get-citizen-info`,
			{ pinpp: "00000000000000", birth_date: "2000-01-01" },
			{
				headers: {
					Authorization: `Bearer ${token}`,
					"Content-Type": "application/json",
				},
				decompress: true,
				timeout: 5000,
			},
		);
		return true;
	} catch (err) {
		// 401 = token noto'g'ri yoki eskirgan
		if (err.response?.status === 401) return false;
		// 400 = token ishlayapti, lekin so'rov noto'g'ri (bu yaxshi!)
		if (err.response?.status === 400) return true;
		// Boshqa xato — token ishlayapti
		if (err.response) return true;
		return false;
	}
}

module.exports = { saveToken, getToken, deleteToken, verifyToken };
