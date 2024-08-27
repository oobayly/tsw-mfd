import { Injectable } from "@angular/core";
import { distinctUntilChanged, filter, firstValueFrom, map, Observable, Observer, of, retry, shareReplay, switchMap, tap, timeout } from "rxjs";
import { SetttingsService } from "./setttings.service";

export interface SocketEvent<TArgs = unknown, TEvent extends string = string> {
  event: TEvent;
  args: TArgs;
}

function handleSocketMessage(e: MessageEvent): SocketEvent | undefined {
  if (typeof e.data !== "string") {
    console.log(`Expected string from WebSocket server, received ${typeof e.data}`);

    return;
  }

  let event: string;
  let args: unknown[];

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const parsed = JSON.parse(e.data) as any[];
    ([event, ...args] = parsed);

  } catch (e) {
    console.log(`Received malformed data: ${e}`);

    return;
  }

  return {
    event,
    args: args.length === 1 ? args[0] : args,
  };
}

@Injectable({
  providedIn: "root",
})
export class TswSocketService {
  // ========================
  // Properties
  // ========================

  public readonly socket$: Observable<WebSocket | undefined>;

  // ========================
  // Lifecycle
  // ========================

  constructor(
    readonly settings: SetttingsService,
  ) {
    this.socket$ = settings.watchSetting("websocket").pipe(
      map((settings) => {
        if (!settings?.host || !settings?.port) {
          return undefined;
        }

        return `ws://${settings.host}:${settings.port}`;
      }),
      distinctUntilChanged(),
      switchMap((uri) => {
        if (!uri) {
          return of(undefined);
        }

        return new Observable<WebSocket>((observer) => {
          const socket = new WebSocket(uri);

          const handleOpen = () => observer.next(socket);
          const handleError = (e: Event) => observer.error(e);
          const handleClose = () => observer.complete();

          socket.addEventListener("open", handleOpen);
          socket.addEventListener("close", handleClose);
          socket.addEventListener("error", handleError);

          return () => {
            socket.removeEventListener("open", handleOpen);
            socket.removeEventListener("close", handleClose);
            socket.removeEventListener("error", handleError);

            if (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING) {
              socket.close();
            }
          }
        });
      }),
      retry({
        count: Infinity,
        delay: 1000,
      }),
      shareReplay(1),
    )
  }

  public getSocket(): Promise<WebSocket | undefined> {
    return firstValueFrom(this.socket$);
  }

  public async emit(event: string, ...args: unknown[]): Promise<void> {
    const socket = await this.getSocket();

    if (!socket) {
      throw new Error("Socket is not connected.");
    }

    socket.send(JSON.stringify([event, ...args]));
  }

  /** Listens to all events. */
  public fromAny<T extends SocketEvent>(): Observable<T>;
  /** Listens to any of the specified events. */
  public fromAny<T extends SocketEvent>(...eventNames: T["event"][]): Observable<T>;
  public fromAny<T extends SocketEvent>(...eventNames: T["event"][]): Observable<T> {
    const names = eventNames.length ? new Set(eventNames) : undefined;

    return this.socket$.pipe(
      filter((socket) => !!socket),
      switchMap((socket) => {
        return new Observable<T>((observer: Observer<T>) => {

          const handleMessage = (e: MessageEvent<T>) => {
            const parsed = handleSocketMessage(e);

            if (parsed && (!names || names.has(parsed.event))) {
              observer.next(parsed as T);
            }
          };

          socket.addEventListener("message", handleMessage);

          return () => {
            socket.removeEventListener("message", handleMessage);
          };
        });
      }),
    );
  }

  public fromEvent<T = unknown>(fromEvent: string): Observable<T> {
    return this.fromAny<SocketEvent<T>>(fromEvent).pipe(
      map((e) => e.args),
    );
  }

  public fromOneTimeEvent<T = unknown>(fromEvent: string, timeoutMs = 0): Promise<T> {
    return firstValueFrom(this.fromEvent<T>(fromEvent).pipe(
      timeoutMs <= 0 ? tap() : timeout(timeoutMs),
    ));
  }
}
