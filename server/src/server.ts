import readline from "readline/promises";
import { format } from "util";
import { v4 } from "uuid";
import { RawData, Server, WebSocket, WebSocketServer } from "ws";
import { result } from "./simulate";

interface ServerState {
  location?: [number, number];
  simulate?: {
    location?: Readonly<{
      timerId: NodeJS.Timeout;
      points: [number, number][];
    }>;
  }
}

const state: ServerState = {
  location: [50.95, 6.95]
};

const wss = new WebSocketServer({ port: 3000 });
const clients = new Map<string, { ws: WebSocket, remoteAddress?: string }>();

wss.on("connection", (ws, req) => {
  const id = v4();

  clients.set(id, { ws, remoteAddress: req.socket.remoteAddress });
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

const simulateLatLng = () => {
  if (!state.simulate?.location?.timerId) {
    delete state.simulate?.location;
    return;
  }

  const next = state.simulate.location.points.shift();

  if (!next) {
    clearInterval(state.simulate.location.timerId);
    delete state.simulate?.location;
    return;
  }

  const [lat, lng] = next;

  state.location = [lat, lng];

  sendMessage(wss, "latlng", lat, lng);
};

const rl = readline.createInterface({ input: process.stdin });

const readCommands = async (): Promise<void> => {
  while (true) {
    const resp = await rl.question("Enter command: ");

    let match: RegExpMatchArray | null;

    if (match = resp.match(/^latlng (-?[0-9]+(\.[0-9]+)?) (-?[0-9]+(\.[0-9]+)?)$/i)) {
      const lat = parseFloat(match[1]);
      const lng = parseFloat(match[3]);

      state.location = [lat, lng];

      sendMessage(wss, "latlng", lat, lng);
    } else if (match = resp.match(/^latlng simulate/i)) {
      if (state.simulate?.location?.timerId) {
        clearInterval(state.simulate.location.timerId);
        delete state.simulate.location;
      }

      if (!state.simulate) {
        state.simulate = {};
      }

      state.simulate.location = {
        points: result,
        timerId: setInterval(simulateLatLng, 1000),
      };
    } else if (resp === "clients") {
      [...wss.clients].forEach((ws, index) => {
        const client = [...clients.entries()].find(([_, value]) => value.ws === ws);
        const id = client?.[0] ?? "-";
        const remoteAddress = client?.[1].remoteAddress ?? "-";

        console.log(format("%s: %s %i %s", index.toFixed().padStart(2, " "), id, ws.readyState, remoteAddress));
      })
    }
  }
}

readCommands().then();
