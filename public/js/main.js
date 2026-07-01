import { startBot, stopBot } from "./bot.js";
import { clearFile, showFile } from "./file.js";
import { openTokenPopup, closeTokenPopup, saveToken } from "./token.js";

// Barcha funksiyalarni window obyektiga biriktiramiz
window.openTokenPopup = openTokenPopup;
window.closeTokenPopup = closeTokenPopup;
window.saveToken = saveToken;
window.startBot = startBot;
window.stopBot = stopBot;
window.clearFile = clearFile;

// Drag & Drop hodisalari
window.handleDragOver = (e) => e.preventDefault();
window.handleDragLeave = () => {};
window.handleDrop = (e) => {
	e.preventDefault();
	if (e.dataTransfer.files[0]) showFile(e.dataTransfer.files[0]);
};
window.handleFileSelect = (input) => {
	if (input.files[0]) showFile(input.files[0]);
};
