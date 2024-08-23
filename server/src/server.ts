// Import the 'express' module
import express from 'express';
import http from "http";
import readline from "readline/promises";
import { Server } from "socket.io";
import { v4 } from "uuid";

// Create an Express application
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Set the port number for the server
const port = 3000;

// Define a route for the root path ('/')
app.get('/', (req, res) => {
  // Send a response to the client
  res.send('Hello, TypeScript + Node.js + Express!');
});

io.on("connection", (socket) => {
  const id = v4();
  console.log(`${id}: connected`);

  socket.emit("client_id", id);

  socket.on("echo", (values) => {
    console.log(`${id}: requested echo`);

    socket.emit("echo", values);
  });

  socket.on("now", () => {
    console.log(`${id}: requested now`);

    socket.emit("now", Date.now());
  });

  socket.on("disconnect", () => {
    console.log(`${id}: disconnect`);
  });
});

// let last = Date.now();

// setInterval(() => {
//   io.emit("now", Date.now());

//   // const now = Date.now();
//   // const dT = now - last;

//   // console.log(`emit: ${dT} ms`);

//   // last = now;
// }, 40);

// Start the server and listen on the specified port
server.listen(port, () => {
  // Log a message when the server is successfully running
  console.log(`Server is running on http://localhost:${port}`);
});

const rl = readline.createInterface({ input: process.stdin });

const readCommands = async (): Promise<void> => {
  while (true) {
    const resp = await rl.question("Enter command: ");

    let match: RegExpMatchArray | null;

    if (match = resp.match(/latlng (-?[0-9]+(\.[0-9]+)?) (-?[0-9]+(\.[0-9]+)?)/i)) {
      const lat = parseFloat(match[1]);
      const lng = parseFloat(match[3]);

      io.emit("latlng", { lat, lng });
    }

    // console.log(resp);
  }
}

readCommands().then();
