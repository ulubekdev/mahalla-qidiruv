"use strict";

module.exports = async function clearInputs(page) {
	await page.evaluate((dialogSel) => {
		const dialog = document.querySelector(dialogSel);
		if (!dialog) return;
		// ЖШШИР inputni tozala
		const labels = dialog.querySelectorAll("label");
		for (const label of labels) {
			if (label.innerText && label.innerText.includes("ЖШШИР")) {
				const input = label
					.closest("div")
					.querySelector("input[type='text']");
				if (input) {
					const setter = Object.getOwnPropertyDescriptor(
						window.HTMLInputElement.prototype,
						"value",
					).set;
					setter.call(input, "");
					input.dispatchEvent(new Event("input", { bubbles: true }));
					input.dispatchEvent(new Event("change", { bubbles: true }));
				}
				break;
			}
		}
		// FISH placeholder tozala
		dialog
			.querySelectorAll("input[readonly]")
			.forEach((inp) => inp.setAttribute("placeholder", ""));
	}, process.env.SEL_DIALOG);
	await page.waitForTimeout(300);
};
