"use strict";

const axios = require("axios");
const parseBirthDate = require("../helpers/parseBirthDate.js");

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

async function getCitizenInfo(api, pinfl) {
	const birthDate = parseBirthDate(pinfl);
	if (!birthDate) throw new Error(`Noto'g'ri JSHSHR: ${pinfl}`);

	const res = await api.post("/citizen/get-citizen-info", {
		pinpp: pinfl,
		birth_date: birthDate,
	});

	const r = res.data?.response;
	if (!r) throw new Error("Fuqaro topilmadi");

	return `${r.surnamelat} ${r.namelat} ${r.patronymlat}`.trim();
}

module.exports = { createApi, getCitizenInfo };
