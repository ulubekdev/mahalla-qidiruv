"use strict";

const angularFill = require("../helpers/angularFill");
const clearInputs = require("../helpers/clearInputs");
const hasToastError = require("../helpers/hasToastError");
const waitToastGone = require("../helpers/waitToastGone");
const readFish = require("../helpers/readFish");
const formatDuration = require("../helpers/formatDuration");
const isBrowserClosed = require("../helpers/isBrowserClosed");

// Selectorlar
const sel = {
	dialog: () => (page) => page.locator(process.env.SEL_DIALOG).last(),
	jshshrInput: (dialog) =>
		dialog.locator(process.env.SEL_JSHSHR_INPUT).first(),
	searchBtn: (dialog) => dialog.locator(process.env.SEL_SEARCH_BTN).first(),
	fishInput: (dialog) => dialog.locator(process.env.SEL_FISH_INPUT).first(),
	continueBtn: (page) => page.locator(process.env.SEL_CONTINUE_BTN).first(),
};

async function openDialog(page) {
	await page.locator(process.env.SEL_OPEN_DIALOG_BTN).first().click();
	await page.waitForSelector(
		`${process.env.SEL_DIALOG} ${process.env.SEL_JSHSHR_INPUT}`,
		{ timeout: Number(process.env.TIMEOUT_DIALOG) || 8000 },
	);
}

async function processPinfl(page, pinfl, timeoutResult) {
	const dialog = page.locator(process.env.SEL_DIALOG).last();
	const jshshrInput = dialog.locator(process.env.SEL_JSHSHR_INPUT).first();
	const searchBtn = dialog.locator(process.env.SEL_SEARCH_BTN).first();
	const fishInput = () => dialog.locator(process.env.SEL_FISH_INPUT).first();
	const continueBtn = page.locator(process.env.SEL_CONTINUE_BTN).first();

	if (await hasToastError(page)) await waitToastGone(page);
	await clearInputs(page);
	await angularFill(page, jshshrInput, pinfl);
	await searchBtn.click();

	await Promise.race([
		page
			.waitForFunction(
				(sel) => {
					const inputs = document.querySelectorAll(
						`${sel} input[readonly]`,
					);
					for (const inp of inputs)
						if (
							inp.placeholder &&
							inp.placeholder.trim().length > 2
						)
							return true;
					return false;
				},
				process.env.SEL_DIALOG,
				{ timeout: timeoutResult },
			)
			.catch(() => null),

		page
			.waitForSelector(process.env.SEL_CONTINUE_BTN, {
				timeout: timeoutResult,
			})
			.catch(() => null),

		page
			.waitForFunction(
				({ sel, text }) => {
					const toasts = document.querySelectorAll(sel);
					for (const t of toasts)
						if (t.innerText && t.innerText.includes(text))
							return true;
					return false;
				},
				{
					sel: process.env.SEL_TOAST_MSG,
					text: process.env.TOAST_ERROR_TEXT,
				},
				{ timeout: timeoutResult },
			)
			.catch(() => null),
	]);

	// Toast xatolik
	if (await hasToastError(page)) {
		await waitToastGone(page);
		return { status: "error", reason: "Хatolik yuz berdi" };
	}

	// Avval qo'shilgan
	const continueVisible = await continueBtn.isVisible().catch(() => false);
	if (continueVisible) {
		await continueBtn.click({ force: true });
		await page
			.waitForSelector(process.env.SEL_CONTINUE_BTN, {
				state: "hidden",
				timeout: 4000,
			})
			.catch(() => {});
		return { status: "skipped" };
	}

	// FISH
	const fish = await readFish(page, fishInput);
	if (fish && fish.length > 2) {
		return { status: "success", fish };
	}

	return { status: "error", reason: "FISH topilmadi" };
}

async function runLoop({ page, data, isRunningFn, onLog, onProgress }) {
	const yangiFuqarolar = [];
	const xatoFuqarolar = [];
	let topildi = 0,
		otkazildi = 0;
	const pinflVaqtlari = [];
	const boshlanishVaqti = Date.now();
	const timeoutResult = Number(process.env.TIMEOUT_RESULT) || 6000;

	for (let i = 0; i < data.length; i++) {
		if (!isRunningFn()) break;

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
			const result = await processPinfl(page, pinfl, timeoutResult);
			const dur = Date.now() - t0;
			pinflVaqtlari.push(dur);

			if (result.status === "success") {
				onLog(
					"success",
					`[${i + 1}/${data.length}] ✅ ${pinflMasked} → ${result.fish} (${formatDuration(dur)})`,
				);
				yangiFuqarolar.push({ PINFL: pinfl, FISH: result.fish });
				topildi++;
			} else if (result.status === "skipped") {
				onLog(
					"info",
					`[${i + 1}/${data.length}] ⏭️ ${pinflMasked} — avval qo'shilgan (${formatDuration(dur)})`,
				);
				otkazildi++;
			} else {
				onLog(
					"warn",
					`[${i + 1}/${data.length}] ⚠️ ${pinflMasked} — ${result.reason} (${formatDuration(dur)})`,
				);
				xatoFuqarolar.push({ PINFL: pinfl, SABAB: result.reason });
			}
		} catch (err) {
			if (isBrowserClosed(err)) {
				onLog(
					"warn",
					"🔴 Brauzer yopib yuborildi. Iltimos qaytadan urinib ko'ring.",
				);
				break;
			}
			if (!isRunningFn()) break;

			const dur = Date.now() - t0;
			pinflVaqtlari.push(dur);
			onLog(
				"error",
				`[${i + 1}/${data.length}] ❌ ${pinflMasked} — ${err.message.slice(0, 80)}`,
			);
			xatoFuqarolar.push({
				PINFL: pinfl,
				SABAB: err.message.slice(0, 100),
			});
			try {
				await waitToastGone(page);
			} catch {}
		}

		onProgress({
			current: i + 1,
			total: data.length,
			topildi,
			otkazildi,
			xato: xatoFuqarolar.length,
		});
	}

	const umumiyVaqt = Date.now() - boshlanishVaqti;
	const ortachaVaqt = pinflVaqtlari.length
		? Math.round(
				pinflVaqtlari.reduce((a, b) => a + b, 0) / pinflVaqtlari.length,
			)
		: 0;

	return {
		yangiFuqarolar,
		xatoFuqarolar,
		topildi,
		otkazildi,
		xato: xatoFuqarolar.length,
		umumiyVaqt: formatDuration(umumiyVaqt),
		ortachaVaqt: formatDuration(ortachaVaqt),
	};
}

module.exports = { openDialog, runLoop };
