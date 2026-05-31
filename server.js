"use strict";

require("dotenv").config();

const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const botSocket = require("./events/bot.socket");
const uploadRoute = require("./routes/upload.route");
const cleanOldFiles = require("./helpers/cleanOldFiles");

// =========================
// APP
// =========================
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
	cors: {
		origin: "*", // productionda cheklanadi
		methods: ["GET", "POST"],
	},
});

// =========================
// MIDDLEWARE
// =========================
app.use(express.json());
app.use(express.static("public"));
app.use("/results", express.static("storage/results"));

// =========================
// ROUTES
// =========================
app.use("/upload", uploadRoute);

// =========================
// SOCKET
// =========================
botSocket(io);

// =========================
// ESKI FAYLLARNI TOZALASH
// Har 30 daqiqada — 1 soatdan oshgan natija fayllar o'chiriladi
// =========================

setInterval(cleanOldFiles, 30 * 60 * 1000);

// =========================
// 404 / ERROR HANDLER
// =========================
app.use((req, res) => {
	res.status(404).json({ success: false, error: "Not found" });
});

app.use((err, req, res, next) => {
	console.error(err);
	res.status(500).json({ success: false, error: err.message });
});

// =========================
// START
// =========================
const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
	console.log(`✅ Server ishga tushdi: http://localhost:${PORT}`);
});
