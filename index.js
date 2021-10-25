const express = require("express");
const socket = require("socket.io");
const http = require("http");
const cors = require("cors");
const PDFDocument = require("pdfkit");

const app = express();
const httpServer = http.createServer(app);
const io = socket(httpServer, {
	cors: {
		origin: "*",
		methods: ["GET", "POST"],
	},
});

const elections = [0, 0, 0];
const messages = [];

app.use(cors({ origin: true }));

app.get("/elections/", (_, res) => {
	res.json(elections);
});

app.get("/messages/", (_, res) => {
	res.json(messages);
});

io.on("connection", (socket) => {
	console.log("a user connected", socket.id);
	socket.on("disconnect", (reason) => {
		console.log("a user disconnected", reason);
	});

	socket.on("requestReport", (payload) => {
		const doc = new PDFDocument({ bufferPages: true });

		let buffers = [];
		doc.on("data", buffers.push.bind(buffers));
		doc.on("end", () => {
			const pdfData = Buffer.concat(buffers);
			const interval = setTimeout(() => {
				socket.emit("respondReport", pdfData);
				clearInterval(interval);
			}, 5000);
		});

		doc.fontSize(25).text("Client Information", 100, 100);
		doc.fontSize(20).text(`Name: ${payload.name}`, 50, 150);
		doc.fontSize(20).text(`Age: ${payload.age}`, 50, 175);
		doc.fontSize(20).text(`Email: ${payload.email}`, 50, 200);
		doc.fontSize(20).text(`Address: ${payload.address}`, 50, 225);
		doc.end();
	});

	socket.on("greeting", (payload) => {
		socket.emit("greetingMessage", { message: `Hi ${payload}, How are you today? ` });
	});

	socket.on("chat-message", (payload) => {
		io.emit("broadcast-message", payload);
	});

	socket.on("election", (payload) => {
		elections[payload] = elections[payload] + 1;
		io.emit("elections", elections);
	});
});


console.log("LISTEN ON ", process.env.PORT);
httpServer.listen(process.env.PORT || 4000);
