"use strict";

module.exports = function formatDuration(ms) {
	const h = Math.floor(ms / 3600000);
	const m = Math.floor((ms % 3600000) / 60000);
	const s = Math.floor((ms % 60000) / 1000);
	const parts = [];
	if (h > 0) parts.push(`${h}h`);
	if (m > 0) parts.push(`${m}m`);
	parts.push(`${s}s`);
	return parts.join(" ");
};
