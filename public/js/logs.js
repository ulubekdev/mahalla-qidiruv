export function addLog(text, type = "info") {
	const box = document.getElementById("logBox");

	const line = document.createElement("div");
	line.className = "log-" + type;

	line.innerHTML = `<span class="log-time">${new Date().toLocaleTimeString("uz-UZ", { hour12: false })}</span>${text}`;

	box.appendChild(line);
	box.scrollTop = box.scrollHeight;
}
