"use strict";

const axios = require("axios");
const parseBirthDate = require("../helpers/parseBirthDate");

const TIMEOUT_SHORT_INFO = Number(process.env.TIMEOUT_SHORT_INFO) || 8000;
const TIMEOUT_EXISTS = Number(process.env.TIMEOUT_EXISTS) || 8000;
const TIMEOUT_CHECK_ADDR = Number(process.env.TIMEOUT_CHECK_ADDR) || 8000;

// Token olib tashlandi, faqat sessionId va cookie qoldi
function createApi(sessionId, cookie) {
	return axios.create({
		baseURL: process.env.API_BASE,
		headers: {
			"Content-Type": "application/json",
			Accept: "application/json, text/plain, */*",
			"X-Session-ID": sessionId,
			Cookie: cookie,
			"X-Year": "2026",
			"User-Agent":
				"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36",
			Referer: "https://mahalla.ijro.uz/dashboard/list/population",
			Origin: "https://mahalla.ijro.uz",
		},
		timeout: 8000,
	});
}

async function getShortInfo(api, pinfl) {
	const birthDate = parseBirthDate(pinfl);
	if (!birthDate) throw new Error(`Noto'g'ri JSHSHR`);

	const res = await api.post(
		"/citizen/get-citizen-short-info",
		{ pinpp: pinfl, birth_date: birthDate },
		{ timeout: TIMEOUT_SHORT_INFO },
	);

	const r = res.data?.response;
	if (!r || !r.citizen_id) throw new Error(`Fuqaro topilmadi`);

	return { citizenId: r.citizen_id, fullName: r.full_name || "" };
}

async function checkExists(api, citizenId) {
	const res = await api.post(
		"/family-member/exists",
		{ citizen_id: citizenId },
		{ timeout: TIMEOUT_EXISTS },
	);

	const r = res.data?.response;
	const mahallaId = r?.mahalla?.id || null;
	return { exists: !!r?.exists, mahallaId };
}

async function checkAddress(api, citizenId) {
	const res = await api.post(
		"/citizen/check-citizen-address",
		{ citizen_id: citizenId, should_refresh: false },
		{ timeout: TIMEOUT_CHECK_ADDR },
	);

	const r = res.data?.response;
	return !!r?.exists;
}

async function processPinfl(api, pinfl, ourMahallaId) {
	// 1. Fuqaro ma'lumotini olish
	const { citizenId, fullName } = await getShortInfo(api, pinfl);

	// 2. Tizimda mavjudligini tekshirish
	const { exists, mahallaId } = await checkExists(api, citizenId);

	// Agar allaqachon bizning mahallada bo'lsa
	if (exists && mahallaId === ourMahallaId) {
		return { status: "exists", fullName };
	}

	// Agar boshqa mahallada bo'lsa
	if (exists && mahallaId !== ourMahallaId) {
		return {
			status: "skip",
			reason: `Boshqa mahallada ro'yxatda`,
		};
	}

	// 3. Propiskasini tekshirish
	const addressOk = await checkAddress(api, citizenId);

	if (!addressOk) {
		return {
			status: "skip",
			reason: `Propiska bu mahallada emas`,
		};
	}

	return { status: "new", fullName };
}

module.exports = {
	createApi,
	getShortInfo,
	checkExists,
	checkAddress,
	processPinfl,
};
