import { addLog } from "./logs.js";
import { setProgress } from "./progress.js";
import {
	openTokenPopup,
	closeTokenPopup,
	setTokenError,
	setSaveBtn,
} from "./token.js";
import { startBot } from "./bot.js";

export const socket = io();
window.socket = socket; // Globalga chiqaramiz (token.js ishlashi uchun)

socket.on("connect", () => {
	socket.emit("check_auth_status");
});

socket.on("log", ({ type, text }) => addLog(text, type));

socket.on("need_session", () => {
	openTokenPopup();
});

socket.on("session_error", (msg) => {
	setTokenError(msg);
	setSaveBtn("normal");
});

socket.on("progress", ({ current, total, topildi, otkazildi, xato }) => {
	const pct = total ? Math.round((current / total) * 100) : 0;
	setProgress(pct);
	document.querySelector(".stat .stat-val.green").textContent = topildi;
	document.querySelector(".stat .stat-val.yellow").textContent = otkazildi;
	document.querySelector(".stat .stat-val.red").textContent = xato;
});

socket.on("status", (s) => {
	if (s === "idle") {
		document.getElementById("startBtn").disabled = false;
		document.getElementById("stopBtn").disabled = true;
	}
});

socket.on("done", ({ topildi, otkazildi, xato, umumiyVaqt, downloadUrl }) => {
	const card = document.getElementById("resultCard");
	card.classList.add("visible");
	document.getElementById("resultGrid").innerHTML = `
        <div class="result-row"><span>Topildi</span><span class="green">${topildi} ta</span></div>
        <div class="result-row"><span>Avval kiritilgan</span><span class="yellow">${otkazildi} ta</span></div>
        <div class="result-row"><span>Xatolik</span><span class="red">${xato} ta</span></div>
        <div class="result-row"><span>Umumiy ketgan vaqt</span><span>${umumiyVaqt}</span></div>
    `;
	document.getElementById("downloadLink").href = downloadUrl;
	card.scrollIntoView({ behavior: "smooth" });
});
