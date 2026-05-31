export let selectedFile = null;

export function showFile(file) {
	const ext = file.name.split(".").pop().toLowerCase();

	if (!["xlsx", "xls"].includes(ext)) return;

	selectedFile = file;

	document.getElementById("dropZone").style.display = "none";
	document.getElementById("fileInfo").style.display = "flex";

	document.getElementById("fileName").textContent = file.name;
}

export function clearFile() {
	selectedFile = null;
	document.getElementById("fileInput").value = "";
	document.getElementById("dropZone").style.display = "block";
	document.getElementById("fileInfo").style.display = "none";
}
