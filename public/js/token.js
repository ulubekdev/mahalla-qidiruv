import { startBot } from "./bot.js";

// DOM yordamchi funksiyalari
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

export function openTokenPopup() {
	document.getElementById("tokenPopup").classList.add("visible");
	setTokenError("");
	setSaveBtn("normal");
}

export function closeTokenPopup() {
	document.getElementById("tokenPopup").classList.remove("visible");
	document.getElementById("startBtn").disabled = false;
	document.getElementById("stopBtn").disabled = true;
}

export function saveToken() {
	const sessionId = document.getElementById("sessionInput").value.trim();
	const cookie = document.getElementById("cookieInput").value.trim();
	const mahallaId = document.getElementById("mahallaInput").value.trim();

	if (!sessionId || !cookie || !mahallaId) {
		setTokenError("Barcha maydonlarni to'ldiring!");
		return;
	}

	setSaveBtn("loading");

	window.socket.on("session_ok", () => {
		setTokenError("");
		setSaveBtn("normal");
		document.getElementById("tokenPopup").classList.remove("visible");
		document.getElementById("startBtn").disabled = false;
		document.getElementById("stopBtn").disabled = true;

		startBot(); // Botni ishga tushiramiz
	});

	window.socket.on("session_error", (msg) => {
		setTokenError(msg);
		setSaveBtn("normal");
		document.getElementById("startBtn").disabled = false;
		document.getElementById("stopBtn").disabled = true;
	});

	// Global socket'ni ishlatamiz (main.js orqali window ga chiqqan)
	window.socket.emit("save_session", {
		userId: localStorage.getItem("userId"),
		sessionId,
		cookie,
		mahallaId,
	});
}

// Boshqa fayllar uchun eksportlar
export { setTokenError, setSaveBtn };
