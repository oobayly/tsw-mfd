import { Injectable, OnDestroy } from "@angular/core";
import { BehaviorSubject, catchError, combineLatest, distinctUntilChanged, filter, firstValueFrom, map, Observable, Observer, of, repeat, shareReplay, Subject, switchMap, takeUntil, tap, timeout } from "rxjs";
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
export class TswSocketService implements OnDestroy {
  // ========================
  // Properties
  // ========================

  private readonly retryInterval = 1000;

  // ========================
  // Observables
  // ========================

  private readonly destroy$ = new Subject<void>();

  public readonly socket$: Observable<WebSocket | undefined>;

  public readonly isConnected$: Observable<boolean>;

  // ========================
  // Lifecycle
  // ========================

  constructor(
    readonly settings: SetttingsService,
  ) {
    const retry$ = new BehaviorSubject<void>(undefined);
    const host$ = settings.watchSetting("websocket").pipe(
      map((settings) => {
        if (!settings?.host || !settings?.port) {
          return undefined;
        }

        return `ws://${settings.host}:${settings.port}`;
      }),
      distinctUntilChanged(),
    );

    this.socket$ = combineLatest([host$, retry$]).pipe(
      switchMap(([uri]) => {
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

            // When the socket closes, immediately retry
            retry$.next();
          }
        });
      }),
      catchError(() => of(undefined)),
      distinctUntilChanged(),
      repeat({
        count: Infinity,
        delay: this.retryInterval,
      }),
      takeUntil(this.destroy$),
      shareReplay(1),
    );

    this.isConnected$ = this.socket$.pipe(map((socket) => socket?.readyState === WebSocket.OPEN));

    return;
  }
  ngOnDestroy(): void {
    this.destroy$.next();
  }

  public getSocket(): Promise<WebSocket | undefined> {
    return firstValueFrom(this.socket$);
  }

  public async emit(event: string, ...args: unknown[]): Promise<void> {
    const socket = await this.getSocket();

    if (!socket || socket.readyState !== WebSocket.OPEN) {
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
