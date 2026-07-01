"use strict";

const fs = require("fs");
const { readExcel, writeExcel } = require("../services/excel.service");
const {
	saveSession,
	getSession,
	deleteSession,
	verifySession,
} = require("../services/token.service"); // Fayl nomini o'zgartirmagan bo'lsangiz
const { createApi, processPinfl } = require("../services/bot.api.service");
const formatDuration = require("../helpers/formatDuration");
const cleanPinfl = require("../helpers/cleanPinfl");

const CONCURRENCY = Number(process.env.CONCURRENCY) || 3;

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

		// ── SESSIYANI SAQLASH VA TEKSHIRISH ──────────────────
		socket.on(
			"save_session",
			async ({ userId, sessionId, cookie, mahallaId }) => {
				if (!sessionId || !cookie)
					return socket.emit(
						"session_error",
						"Ma'lumotlar to'liq emas!",
					);

				socket.emit("session_verifying");

				// Sessiyani tekshiramiz
				const valid = await verifySession(sessionId, cookie);

				if (!valid) {
					return socket.emit(
						"session_error",
						"Sessiya noto'g'ri yoki eskirgan. Brauzerdan yangi ma'lumotlarni oling.",
					);
				}

				saveSession(userId, sessionId, cookie, mahallaId);
				socket.emit("session_ok", { sessionId, cookie, mahallaId });
			},
		);

		// ── BOTNI ISHGA TUSHIRISH ────────────────────────────
		socket.on(
			"start_bot",
			async ({ filePath, userId, sessionId, cookie, mahallaId }) => {
				if (isRunning) return log("warn", "Bot allaqachon ishlayapti!");

				const session = getSession(userId);
				if (!session) {
					socket.emit("need_session");
					return;
				}

				isRunning = true;
				socket.emit("status", "running");

				// API ga sessiya ma'lumotlarini yuboramiz
				const api = createApi(session.sessionId, session.cookie);

				try {
					if (!fs.existsSync(filePath)) {
						log("error", `Fayl topilmadi`);
						isRunning = false;
						socket.emit("status", "idle");
						return;
					}

					const data = readExcel(filePath);
					log(
						"info",
						`📋 Jami ${data.length} ta PINFL — ${CONCURRENCY} parallel`,
					);

					const yangiFuqarolar = [];
					let topildi = 0,
						otkazildi = 0,
						xato = 0,
						processed = 0;
					const pinflVaqtlari = [];
					const boshlanishVaqti = Date.now();

					const pinflList = data
						.map((r) =>
							cleanPinfl(
								r.PINFL || r.JSHSHR || Object.values(r)[0],
							),
						)
						.filter(Boolean);

					async function handleOne(pinfl, index) {
						if (!isRunning) return;
						const t0 = Date.now();

						try {
							const result = await processPinfl(
								api,
								pinfl,
								session.mahallaId,
							);
							const dur = Date.now() - t0;
							pinflVaqtlari.push(dur);

							if (result.status === "new") {
								log(
									"success",
									`[${index + 1}] ✅ ${pinfl} — ${result.fullName}`,
								);
								yangiFuqarolar.push({
									PINFL: pinfl,
									FISH: result.fullName,
								});
								topildi++;
							} else {
								log(
									"info",
									`[${index + 1}] ⏭️ ${pinfl} — ${result.status === "exists" ? "Avval kiritilgan" : result.reason}`,
								);
								otkazildi++;
							}
						} catch (err) {
							if (
								err.response?.status === 401 ||
								err.response?.status === 403
							) {
								deleteSession(userId);
								log("error", "⚠️ Sessiya tugadi!");
								socket.emit("need_session");
								isRunning = false;
								return;
							}
							xato++;
						}
						processed++;
						socket.emit("progress", {
							current: processed,
							total: pinflList.length,
							topildi,
							otkazildi,
							xato,
						});
					}

					let cursor = 0;
					async function worker() {
						while (isRunning && cursor < pinflList.length) {
							await handleOne(pinflList[cursor++], cursor - 1);
						}
					}

					await Promise.all(
						Array.from(
							{ length: Math.min(CONCURRENCY, pinflList.length) },
							() => worker(),
						),
					);

					const downloadUrl = writeExcel({ userId, yangiFuqarolar });
					socket.emit("done", {
						topildi,
						otkazildi,
						xato,
						umumiyVaqt: formatDuration(
							Date.now() - boshlanishVaqti,
						),
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
			},
		);
	});
};
