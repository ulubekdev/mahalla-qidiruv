"use strict";

module.exports = function cleanPinfl(raw) {
	if (!raw) return null;
	const digitsOnly = String(raw).replace(/\D/g, "");
	if (digitsOnly.length !== 14) return null;
	return digitsOnly;
};
