import { socket } from "./socket.js";
import { addLog } from "./logs.js";
import { startBot } from "./bot.js";

export function openTokenPopup() {
	document.getElementById("tokenPopup").classList.add("visible");
	document.getElementById("tokenInput").focus();
	// Xato yozuvni tozalash
	setTokenError("");
	setSaveBtn("normal");
}

export function closeTokenPopup() {
	document.getElementById("tokenPopup").classList.remove("visible");
	document.getElementById("tokenInput").value = "";
	setTokenError("");
	setSaveBtn("normal");
	document.getElementById("startBtn").disabled = false;
	document.getElementById("stopBtn").disabled = true;
}

export function saveToken() {
	const token = document.getElementById("tokenInput").value.trim();
	if (!token) {
		setTokenError("Token bo'sh!");
		return;
	}
	// Loading holati
	setSaveBtn("loading");
	setTokenError("");

	const userId = localStorage.getItem("userId");
	socket.emit("save_token", { userId, token });
}

// =========================
// YORDAMCHI
// =========================
function setTokenError(msg) {
	const el = document.getElementById("tokenError");
	if (!el) return;
	el.textContent = msg;
	el.style.display = msg ? "block" : "none";
}

function setSaveBtn(state) {
	const btn = document.getElementById("tokenSaveBtn");
	if (!btn) return;
	if (state === "loading") {
		btn.disabled = true;
		btn.textContent = "Tekshirilmoqda...";
	} else {
		btn.disabled = false;
		btn.textContent = "Saqlash";
	}
}

// =========================
// SOCKET EVENTS
// =========================
socket.on("need_token", () => {
	openTokenPopup();
});

socket.on("token_verifying", () => {
	setSaveBtn("loading");
});

socket.on("token_error", (msg) => {
	setTokenError(msg);
	setSaveBtn("normal");
});

socket.on("token_ok", () => {
	closeTokenPopup();
	addLog("✅ Token saqlandi", "success");
	startBot();
});
