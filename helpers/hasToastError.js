"use strict";

module.exports = async function hasToastError(page) {
	return page.evaluate(
		({ sel, text }) => {
			const toasts = document.querySelectorAll(sel);
			for (const t of toasts) {
				if (t.innerText && t.innerText.includes(text)) return true;
			}
			return false;
		},
		{
			sel: process.env.SEL_TOAST_MSG,
			text: process.env.TOAST_ERROR_TEXT,
		},
	);
};
