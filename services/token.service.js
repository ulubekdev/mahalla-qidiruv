"use strict";

const fs = require("fs");
const path = require("path");
const axios = require("axios");

const TOKEN_DIR = "storage/auth";

if (!fs.existsSync(TOKEN_DIR)) fs.mkdirSync(TOKEN_DIR, { recursive: true });

function sessionFile(userId) {
	return path.join(TOKEN_DIR, `session_${userId}.json`);
}

function saveSession(userId, sessionId, cookie, mahallaId) {
	fs.writeFileSync(
		sessionFile(userId),
		JSON.stringify({
			sessionId,
			cookie,
			mahallaId,
			savedAt: Date.now(),
		}),
	);
}

function getSession(userId) {
	const file = sessionFile(userId);
	if (!fs.existsSync(file)) return null;
	try {
		return JSON.parse(fs.readFileSync(file, "utf-8"));
	} catch {
		return null;
	}
}

function deleteSession(userId) {
	const file = sessionFile(userId);
	if (fs.existsSync(file)) fs.unlinkSync(file);
}

// Sessiya ishlayaptimi yoki yo'qligini tekshirish
async function verifySession(sessionId, cookie) {
	try {
		// O'zingiz bergan headerlar bilan so'rov yuboramiz
		await axios.post(
			`${process.env.API_BASE}/citizen/get-citizen-short-info`,
			{ pinpp: "00000000000000", birth_date: "2000-01-01" },
			{
				headers: {
					"X-Session-ID": sessionId,
					Cookie: cookie,
					"Content-Type": "application/json",
					"X-Year": "2026",
				},
				timeout: 5000,
			},
		);
		return true;
	} catch (err) {
		// 401 yoki 403 bo'lsa sessiya yaroqsiz
		if (err.response?.status === 401 || err.response?.status === 403)
			return false;
		// Boshqa xatolar (masalan 400 - ma'lumot topilmadi) sessiya ishlayotganini bildiradi
		return true;
	}
}

module.exports = { saveSession, getSession, deleteSession, verifySession };
