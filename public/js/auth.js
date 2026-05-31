import { socket } from "./socket.js";
import { addLog } from "./logs.js";

export function loginDone() {
	socket.emit("login_done");
	document.getElementById("loginBanner").classList.remove("visible");
	addLog("Login tasdiqlandi", "success");
}
