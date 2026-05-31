"use strict";

const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");

const AUTH_DIR = "storage/auth";
if (!fs.existsSync(AUTH_DIR)) fs.mkdirSync(AUTH_DIR, { recursive: true });

function getStateFile(userId) {
	return path.join(AUTH_DIR, `state_${userId}.json`);
}

async function openBrowser() {
	return chromium.launch({
		headless: false,
		args: ["--start-maximized"],
	});
}

async function openPage(browser, userId) {
	const stateFile = getStateFile(userId);

	const ctx = fs.existsSync(stateFile)
		? await browser.newContext({ storageState: stateFile, viewport: null })
		: await browser.newContext({ viewport: null });

	const page = await ctx.newPage();
	await page.setViewportSize({ width: 1920, height: 1080 });

	return { page, ctx };
}

async function checkLogin(page) {
	try {
		await page.waitForSelector(process.env.SEL_OPEN_DIALOG_BTN, {
			timeout: 5000,
		});
		return true;
	} catch {
		return false;
	}
}

async function saveSession(ctx, userId) {
	const stateFile = getStateFile(userId);
	await ctx.storageState({ path: stateFile });
}

module.exports = { openBrowser, openPage, checkLogin, saveSession };
