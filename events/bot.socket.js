"use strict";

const fs = require("fs");

const { readExcel, writeExcel } = require("../services/excel.service");
const {
	openBrowser,
	openPage,
	checkLogin,
	saveSession,
} = require("../services/browser.service");
const { openDialog, runLoop } = require("../services/bot.service");

module.exports = (io) => {
	io.on("connection", (socket) => {
		console.log("CONNECTED:", socket.id);

		let browser = null;
		let isRunning = false;
		let loginResolve = null;

		async function cleanup() {
			isRunning = false;
			socket.emit("status", "idle");
			if (browser) {
				await browser.close().catch(() => {});
				browser = null;
			}
		}

		const log = (type, text) => socket.emit("log", { type, text });

		socket.on("login_done", () => {
			if (loginResolve) {
				loginResolve();
				loginResolve = null;
			}
		});

		socket.on("stop_bot", async () => {
			isRunning = false;
			log("warn", "⏹️ To'xtatildi");
			await cleanup();
		});

		socket.on("disconnect", async () => {
			console.log("DISCONNECTED:", socket.id);
			await cleanup();
		});

		socket.on("start_bot", async ({ filePath, userId }) => {
			if (isRunning) return log("warn", "Allaqachon ishlayapti!");
			if (!userId) return log("error", "userId yo'q!");

			isRunning = true;
			socket.emit("status", "running");

			try {
				// ── FAYL ─────────────────────────────────────
				if (!fs.existsSync(filePath)) {
					log("error", `Fayl topilmadi: ${filePath}`);
					return await cleanup();
				}

				const data = readExcel(filePath);
				log("info", `📋 Jami ${data.length} ta PINFL`);

				// ── BRAUZER ───────────────────────────────────
				browser = await openBrowser();
				const { page, ctx } = await openPage(browser, userId);

				await page.goto(process.env.MAHALLA_URL);

				// ── LOGIN ─────────────────────────────────────
				const loggedIn = await checkLogin(page);

				if (loggedIn) {
					socket.emit("login_confirmed");
					log("success", "✅ Session aktiv — login shart emas");
					if (
						!require("fs").existsSync(
							`storage/auth/state_${userId}.json`,
						)
					) {
						await saveSession(ctx, userId);
					}
				} else {
					socket.emit("need_login");
					log(
						"warn",
						"🔐 Brauzerda login qiling, keyin Tayyor bosing",
					);
					await new Promise((resolve) => {
						loginResolve = resolve;
					});
					await saveSession(ctx, userId);
					socket.emit("login_confirmed");
					log("success", "✅ Session saqlandi");
				}

				// ── DIALOG ────────────────────────────────────
				await openDialog(page);
				log("success", "✅ Qidiruv oynasi ochildi");

				// ── LOOP ──────────────────────────────────────
				const result = await runLoop({
					page,
					data,
					isRunningFn: () => isRunning,
					onLog: (type, text) => log(type, text),
					onProgress: (prog) => socket.emit("progress", prog),
				});

				// ── EXCEL SAQLASH ─────────────────────────────
				const downloadUrl = writeExcel({
					userId,
					yangiFuqarolar: result.yangiFuqarolar,
					xatoFuqarolar: result.xatoFuqarolar,
				});

				socket.emit("done", {
					topildi: result.topildi,
					otkazildi: result.otkazildi,
					xato: result.xato,
					umumiyVaqt: result.umumiyVaqt,
					ortachaVaqt: result.ortachaVaqt,
					downloadUrl,
				});
			} catch (err) {
				log("error", `KRITIK XATO: ${err.message}`);
			} finally {
				await cleanup();
				if (filePath && fs.existsSync(filePath)) {
					fs.unlink(filePath, () => {});
				}
			}
		});
	});
};
