"use strict";

module.exports = async function angularFill(page, locator, value) {
	const el = await locator.elementHandle();
	if (!el) throw new Error("Input element topilmadi");
	await page.evaluate(
		({ el, value }) => {
			el.focus();
			const setter = Object.getOwnPropertyDescriptor(
				window.HTMLInputElement.prototype,
				"value",
			).set;
			setter.call(el, value);
			el.dispatchEvent(new Event("input", { bubbles: true }));
			el.dispatchEvent(new Event("change", { bubbles: true }));
			el.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true }));
			el.dispatchEvent(new KeyboardEvent("keyup", { bubbles: true }));
		},
		{ el, value },
	);
};
