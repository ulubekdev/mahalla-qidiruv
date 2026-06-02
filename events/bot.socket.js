"use strict";

const fs = require("fs");

const { readExcel, writeExcel } = require("../services/excel.service");
const {
	saveToken,
	getToken,
	deleteToken,
	verifyToken,
} = require("../services/token.service");
const { createApi, getCitizenInfo } = require("../services/bot.api.service");
const formatDuration = require("../helpers/formatDuration");

module.exports = (io) => {
	io.on("connection", (socket) => {
		console.log("CONNECTED:", socket.id);

		let isRunning = false;
		const log = (type, text) => socket.emit("log", { type, text });

		socket.on("disconnect", () => {
			isRunning = false;
		});

		socket.on("stop_bot", () => {
			isRunning = false;
			log("warn", "⏹️ To'xtatildi");
			socket.emit("status", "idle");
		});

		// =========================
		// TOKEN SAQLASH + TEKSHIRISH
		// =========================
		socket.on("save_token", async ({ userId, token }) => {
			const cleanToken = token.replace(/^Bearer\s+/i, "").trim();

			if (!cleanToken) {
				return socket.emit("token_error", "Token bo'sh!");
			}

			socket.emit("token_verifying"); // loading holati

			const valid = await verifyToken(cleanToken);

			if (!valid) {
				return socket.emit(
					"token_error",
					"Token noto'g'ri yoki eskirgan. Qaytadan login qiling.",
				);
			}

			saveToken(userId, cleanToken);
			socket.emit("token_ok");
		});

		// =========================
		// START BOT
		// =========================
		socket.on("start_bot", async ({ filePath, userId }) => {
			if (isRunning) return log("warn", "Bot allaqachon ishlayapti!");
			if (!userId) return log("error", "userId yo'q!");

			// Token tekshirish
			const token = getToken(userId);
			if (!token) {
				socket.emit("need_token");
				return;
			}

			isRunning = true;
			socket.emit("status", "running");

			const api = createApi(token);

			try {
				if (!fs.existsSync(filePath)) {
					log("error", `Fayl topilmadi: ${filePath}`);
					isRunning = false;
					socket.emit("status", "idle");
					return;
				}

				const data = readExcel(filePath);
				log("info", `📋 Jami ${data.length} ta PINFL`);

				const yangiFuqarolar = [];
				const xatoFuqarolar = [];
				let topildi = 0,
					xato = 0;
				const pinflVaqtlari = [];
				const boshlanishVaqti = Date.now();

				for (let i = 0; i < data.length; i++) {
					if (!isRunning) break;

					const row = data[i];
					const pinfl = String(
						row.PINFL ||
							row.JSHSHR ||
							row.pinfl ||
							row.jshshr ||
							Object.values(row)[0] ||
							"",
					).trim();
					if (!pinfl) continue;

					const pinflMasked = pinfl.slice(0, -4) + "****";
					const t0 = Date.now();

					try {
						const fish = await getCitizenInfo(api, pinfl);
						const dur = Date.now() - t0;
						pinflVaqtlari.push(dur);

						log(
							"success",
							`[${i + 1}/${data.length}] ✅ ${pinflMasked} → ${fish}`,
						);
						yangiFuqarolar.push({ PINFL: pinfl, FISH: fish });
						topildi++;
					} catch (err) {
						const dur = Date.now() - t0;
						pinflVaqtlari.push(dur);

						// Token eskirgan — tokenni o'chirib popup chiqar
						if (err.response?.status === 401) {
							deleteToken(userId);
							log(
								"error",
								"⚠️ Token eskirdi! Qaytadan login qiling.",
							);
							socket.emit("need_token");
							isRunning = false;
							break;
						}

						if (!isRunning) break;

						const msg = err.response?.data?.message || err.message;

						if (msg.toLowerCase().includes(400)) {
							log(
								"warn",
								`[${i + 1}/${data.length}] ⚠️ ${pinflMasked} — Fuqaro ma'lumoti topilmadi`,
							);
							xatoFuqarolar.push({
								PINFL: pinfl,
								SABAB: `Fuqarolikni aniqlab bo'lmadi`,
							});
							xato++;
						}

						if (msg.toLowerCase().includes(403)) {
							log(
								"error",
								`[${i + 1}/${data.length}] ❌ ${pinflMasked} — Ruxsat yo'q (403)`,
							);
							xatoFuqarolar.push({
								PINFL: pinfl,
								SABAB: `Ruxsat yo'q (403)`,
							});
							xato++;

							socket.emit(
								"token_error",
								"Token noto'g'ri yoki eskirgan. Qaytadan login qiling.",
							);
							deleteToken(userId);
							isRunning = false;
							break;
						}

						else {
							log(
								"error",
								`[${i + 1}/${data.length}] ❌ ${pinflMasked} — Xato: ${msg}`,
							);
							xatoFuqarolar.push({
								PINFL: pinfl,
								SABAB: `Xato: ${msg}`,
							});
							xato++;
						}
					}

					socket.emit("progress", {
						current: i + 1,
						total: data.length,
						topildi,
						otkazildi: 0,
						xato,
					});
				}

				const downloadUrl = writeExcel({
					userId,
					yangiFuqarolar,
					xatoFuqarolar,
				});

				const umumiyVaqt = Date.now() - boshlanishVaqti;
				const ortachaVaqt = pinflVaqtlari.length
					? Math.round(
							pinflVaqtlari.reduce((a, b) => a + b, 0) /
								pinflVaqtlari.length,
						)
					: 0;

				socket.emit("done", {
					topildi,
					otkazildi: 0,
					xato,
					umumiyVaqt: formatDuration(umumiyVaqt),
					ortachaVaqt: formatDuration(ortachaVaqt),
					downloadUrl,
				});
			} catch (err) {
				log("error", `KRITIK XATO: ${err.message}`);
			} finally {
				isRunning = false;
				socket.emit("status", "idle");
				if (filePath && fs.existsSync(filePath))
					fs.unlink(filePath, () => {});
			}
		});
	});
};
