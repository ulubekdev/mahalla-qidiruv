"use strict";

// JSHSHR (PINFL) dan tug'ilgan sanani chiqarish
// 1-raqam:
//   1-2 = XVIII asr (1800-1899)
//   3-4 = XIX asr   (1900-1999)
//   5-6 = XX asr    (2000-2099)
// 2-3: kun, 4-5: oy, 6-7: yilning oxirgi 2 raqami

module.exports = function parseBirthDate(pinfl) {
	pinfl = String(pinfl).trim();
	if (pinfl.length !== 14) return null;

	const firstDigit = parseInt(pinfl[0]);
	const day = pinfl.slice(1, 3);
	const month = pinfl.slice(3, 5);
	const yearShort = pinfl.slice(5, 7);

	let century;
	if (firstDigit <= 2) century = "18";
	else if (firstDigit <= 4) century = "19";
	else century = "20";

	return `${century}${yearShort}-${month}-${day}`;
};
