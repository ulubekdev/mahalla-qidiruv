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
			return;
		}

		socket.emit("start_bot", {
			filePath: result.filePath,
			userId,
		});

		addLog("Loyiha start bo‘ldi", "success");
	} catch (err) {
		addLog(err.message, "error");
	}
}

export function stopBot() {
	socket.emit("stop_bot");

	document.getElementById("stopBtn").disabled = true;
	document.getElementById("startBtn").disabled = false;
}
