"use strict";

module.exports = async function readFish(page, getFishInput) {
	try {
		await page.waitForFunction(
			(dialogSel) => {
				const inputs = document.querySelectorAll(
					`${dialogSel} input[readonly]`,
				);
				for (const inp of inputs) {
					if (inp.placeholder && inp.placeholder.trim().length > 2)
						return true;
				}
				return false;
			},
			process.env.SEL_DIALOG,
			{ timeout: 5000 },
		);
	} catch {}

	const el = await getFishInput()
		.elementHandle()
		.catch(() => null);
	if (!el) return "";
	return await page.evaluate(
		(el) =>
			(
				el.value ||
				el.placeholder ||
				el.getAttribute("placeholder") ||
				""
			).trim(),
		el,
	);
};
