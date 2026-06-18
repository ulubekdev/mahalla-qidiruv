"use strict";

const axios = require("axios");
const parseBirthDate = require("../helpers/parseBirthDate");

const TIMEOUT_SHORT_INFO = Number(process.env.TIMEOUT_SHORT_INFO) || 6000;
const TIMEOUT_EXISTS = Number(process.env.TIMEOUT_EXISTS) || 6000;
const TIMEOUT_CHECK_ADDR = Number(process.env.TIMEOUT_CHECK_ADDR) || 8000;

function createApi(token) {
	return axios.create({
		baseURL: process.env.API_BASE,
		headers: {
			Authorization: `Bearer ${token}`,
			"Content-Type": "application/json",
			Accept: "application/json, text/plain, */*",
		},
		decompress: true,
		timeout: Number(process.env.TIMEOUT_RESULT) || 8000,
	});
}

async function getShortInfo(api, pinfl) {
	const birthDate = parseBirthDate(pinfl);
	if (!birthDate) throw new Error(`Noto'g'ri JSHSHR: ${pinfl}`);

	const t0 = Date.now();
	const res = await api.post(
		"/citizen/get-citizen-short-info",
		{ pinpp: pinfl, birth_date: birthDate },
		{ timeout: TIMEOUT_SHORT_INFO },
	);

	const r = res.data?.response;
	if (!r || !r.citizen_id) throw new Error("Fuqaro topilmadi");

	return { citizenId: r.citizen_id, fullName: r.full_name || "" };
}

async function checkExists(api, citizenId) {
	const t0 = Date.now();
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
	const t0 = Date.now();
	const res = await api.post(
		"/citizen/check-citizen-address",
		{ citizen_id: citizenId, should_refresh: false },
		{ timeout: TIMEOUT_CHECK_ADDR },
	);

	const r = res.data?.response;
	return !!r?.exists;
}

async function processPinfl(api, pinfl, ourMahallaId) {
	const tStart = Date.now();

	const { citizenId, fullName } = await getShortInfo(api, pinfl);
	const { exists, mahallaId } = await checkExists(api, citizenId);

	if (exists && mahallaId === ourMahallaId) {
		return { status: "exists", fullName };
	}

	if (exists && mahallaId !== ourMahallaId) {
		return { status: "skip", reason: "Boshqa mahallada ro'yxatda" };
	}

	const addressOk = await checkAddress(api, citizenId);

	if (!addressOk) {
		return { status: "skip", reason: "Propiska bu mahallada emas" };
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
