import { startBot, stopBot } from "./bot.js";
import { clearFile, showFile } from "./file.js";
import { loginDone } from "./auth.js";

window.handleDragOver = (e) => {
	e.preventDefault();
};

window.handleDragLeave = () => {};
window.loginDone = loginDone;
window.clearFile = clearFile;

window.handleDrop = (e) => {
	e.preventDefault();
	const file = e.dataTransfer.files[0];
	if (file) showFile(file);
};

window.handleFileSelect = (input) => {
	if (input.files[0]) showFile(input.files[0]);
};

document.getElementById("startBtn").onclick = startBot;
document.getElementById("stopBtn").onclick = stopBot;
