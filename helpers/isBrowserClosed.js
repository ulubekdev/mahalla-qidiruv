"use strict";

module.exports = function isBrowserClosed(err) {
	const msg = err.message || "";
	return (
		msg.includes("Target page, context or browser has been closed") ||
		msg.includes("Target closed") ||
		msg.includes("Session closed") ||
		msg.includes("Browser has been closed")
	);
};
