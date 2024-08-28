import readline from "readline/promises";
import { BehaviorSubject, distinctUntilChanged, map } from "rxjs";
import { format } from "util";
import { v4 } from "uuid";
import { RawData, Server, WebSocket, WebSocketServer } from "ws";
import { interpolateKolnAachen } from "./simulate";

interface ServerState {
  readonly location$: BehaviorSubject<[number, number]>,
  simulate?: {
    location?: Readonly<{
      timerId: NodeJS.Timeout;
      points: [number, number][];
    }>;
  }
}

const state: ServerState = {
  location$: new BehaviorSubject([50.95, 6.95]),
};

const wss = new WebSocketServer({ port: 3000 });
const clients = new Map<string, { ws: WebSocket, remoteAddress?: string }>();

wss.on("connection", (ws, req) => {
  const id = v4();

  clients.set(id, { ws, remoteAddress: req.socket.remoteAddress });
  console.log(`${id}: Connection from ${req.socket.remoteAddress}`);

  sendMessage(ws, "client_id", id);

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
      sendLocation(ws, ...state.location$.value);
      break;
    case "latlng":
      if (typeof args[0] === "number" && typeof args[1] === "number") {
        state.location$.next([args[0], args[1]]);
      }
      break;
  }
}

const sendLocation = (target: Server | WebSocket, lat: number, lng: number): void => {
  sendMessage(target, "latlng", lat, lng);
};

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

  state.location$.next(next);
};

const rl = readline.createInterface({ input: process.stdin });

const readCommands = async (): Promise<void> => {
  while (true) {
    const resp = await rl.question("Enter command: ");

    let match: RegExpMatchArray | null;

    if (match = resp.match(/^latlng (-?[0-9]+(\.[0-9]+)?) (-?[0-9]+(\.[0-9]+)?)$/i)) {
      // latlng <lat> <lng>
      const lat = parseFloat(match[1]);
      const lng = parseFloat(match[3]);

      console.log(`Setting location to ${lat}, ${lng}`);

      state.location$.next([lat, lng]);
    } else if (match = resp.match(/^latlng simulate( (stop|[0-9]+))?( ([.0-9]+))?/i)) {
      // latlng simulate stop
      // latlng simulate [kmph = 360]? [precision = 1]?
      if (state.simulate?.location?.timerId) {
        clearInterval(state.simulate.location.timerId);
        delete state.simulate.location;
      }

      if (match[2] === "stop") {
        return;
      }

      const speed = match[2] ? parseInt(match[2]) : 160;
      const stepsPerSec = match[4] ? parseFloat(match[4]) : 1;

      if (!state.simulate) {
        state.simulate = {};
      }

      console.log(`Simulating location at ${speed} km/h at ${stepsPerSec} steps per second.`);

      state.simulate.location = {
        points: interpolateKolnAachen(speed / stepsPerSec), // Factor of 8 to improve smoothness
        timerId: setInterval(simulateLatLng, 1000 / stepsPerSec),
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

// Send the locations, truncated to the specified precision
state.location$.pipe(
  map(([lat, lng]) => {
    const precision = 1e5;

    return [Math.round(lat * precision) / precision, Math.round(lng * precision) / precision];
  }),
  distinctUntilChanged((p, c) => p[0] === c[0] && p[1] === c[1]),
).subscribe(([lat, lng]) => {
  sendLocation(wss, lat, lng);
})

readCommands().then();
