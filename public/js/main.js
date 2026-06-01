import { startBot, stopBot } from "./bot.js";
import { clearFile, showFile } from "./file.js";
import { loginDone } from "./auth.js";
import { openTokenPopup, closeTokenPopup, saveToken } from "./token.js";

window.handleDragOver = (e) => {
	e.preventDefault();
};
window.handleDragLeave = () => {};

window.handleDrop = (e) => {
	e.preventDefault();
	const file = e.dataTransfer.files[0];
	if (file) showFile(file);
};

window.handleFileSelect = (input) => {
	if (input.files[0]) showFile(input.files[0]);
};

// HTML da onclick ishlatish uchun window ga chiqarish
window.loginDone = loginDone;
window.clearFile = clearFile;
window.closeTokenPopup = closeTokenPopup;
window.saveToken = saveToken;

document.getElementById("startBtn").onclick = startBot;
document.getElementById("stopBtn").onclick = stopBot;
