import { socket } from "./socket.js";
import { selectedFile } from "./file.js";
import { addLog } from "./logs.js";

let userId = localStorage.getItem("userId");

if (!userId) {
	userId = crypto.randomUUID();
	localStorage.setItem("userId", userId);
}

export async function startBot() {
	if (!selectedFile) {
		return addLog("Excel fayl tanlang!", "error");
	}

	const sessionId = document.getElementById("sessionInput").value.trim();
	const cookie = document.getElementById("cookieInput").value.trim();
	const mahallaId = document.getElementById("mahallaInput").value.trim();

	if (!sessionId || !cookie || !mahallaId) {
		openTokenPopup();
		return addLog("Sessiya ma'lumotlarini to'ldiring!", "error");
	}

	document.getElementById("startBtn").disabled = true;
	document.getElementById("stopBtn").disabled = false;

	const formData = new FormData();
	formData.append("excel", selectedFile);

	try {
		const upload = await fetch("/upload", {
			method: "POST",
			body: formData,
		});

		const result = await upload.json();

		if (!result.success) {
			addLog(result.error, "error");
			document.getElementById("startBtn").disabled = false;
			document.getElementById("stopBtn").disabled = true;
			return;
		}

		// Serverga sessiya ma'lumotlari bilan birga yuboramiz
		socket.emit("start_bot", {
			filePath: result.filePath,
			userId,
			sessionId,
			cookie,
			mahallaId,
		});

		addLog("Qidiruv boshlandi...", "success");
	} catch (err) {
		addLog("Serverga ulanishda xatolik: " + err.message, "error");
		document.getElementById("startBtn").disabled = false;
		document.getElementById("stopBtn").disabled = true;
	}
}

export function stopBot() {
	socket.emit("stop_bot");

	document.getElementById("stopBtn").disabled = true;
	document.getElementById("startBtn").disabled = false;
	addLog("Bot to'xtatildi", "warn");
}
