import readline from "readline/promises";
import { v4 } from "uuid";
import { RawData, Server, WebSocket, WebSocketServer } from "ws";

const state: { location?: [number, number] } = { location: [50.95, 6.95] };

const wss = new WebSocketServer({ port: 3000 });
const clients = new Map<string, WebSocket>();

wss.on("connection", (ws, req) => {
  const id = v4();

  clients.set(id, ws);
  console.log(`${id}: Connection from ${req.socket.remoteAddress}`);

  sendMessage(ws, "client_id", id);

  if (state.location) {
    sendMessage(ws, "latlng", ...state.location);
  }

  ws.on("error", (e) => {
    console.log(`${id}: Socket Error`, e);
    clients.delete(id);
  });
  ws.on("close", (code, reason) => {
    console.log(`${id}: Closed with ${code}: ${reason}`);
    clients.delete(id);
  });

  ws.on("message", (data, isBinary) => handleMessage(ws, id, data, isBinary));
});

const handleMessage = (ws: WebSocket, id: string, data: RawData, isBinary: boolean) => {
  console.log(`${id}: Received ${isBinary ? "binary" : "text"} message`, data.toString());

  let event: string;
  let args: any[];

  if (isBinary) {
    // Binary data is not used
    return;
  } else {
    try {
      const parsed = JSON.parse(data.toString()) as any[];
      ([event, ...args] = parsed);

    } catch (e) {
      console.log(`Received malformed data: ${e}`);

      return;
    }
  }

  switch (event) {
    case "latlng?":
      if (state.location) {
        sendMessage(ws, "latlng", ...state.location);
      }
  }

}

const sendMessage = (target: Server | WebSocket, event: string, ...args: any[]): void => {
  const message = JSON.stringify([event, ...args]);

  const send = (ws: WebSocket) => {
    ws.send(message, { binary: false }, (e) => {
      if (e) {
        console.log(`Couldn't send message to client: ${e?.name ?? 'Unknown'}: ${e?.message}`);
      }
    });
  }

  if ("clients" in target) {
    target.clients.forEach((ws) => send(ws));
  } else {
    send(target);
  }
}

const rl = readline.createInterface({ input: process.stdin });

const readCommands = async (): Promise<void> => {
  while (true) {
    const resp = await rl.question("Enter command: ");

    let match: RegExpMatchArray | null;

    if (match = resp.match(/latlng (-?[0-9]+(\.[0-9]+)?) (-?[0-9]+(\.[0-9]+)?)/i)) {
      const lat = parseFloat(match[1]);
      const lng = parseFloat(match[3]);

      state.location = [lat, lng];

      sendMessage(wss, "latlng", lat, lng);
    }
  }
}

readCommands().then();
