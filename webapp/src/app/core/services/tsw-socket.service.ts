import { Injectable } from "@angular/core";
import { Socket } from "ngx-socket-io";
import { distinctUntilChanged, filter, firstValueFrom, map, Observable, Observer, shareReplay, switchMap } from "rxjs";
import { SetttingsService } from "./setttings.service";

export interface AnySocketEvent {
  event: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  args: any | any[];
}

@Injectable({
  providedIn: "root",
})
export class TswSocketService {
  // ========================
  // Properties
  // ========================

  public readonly socket$: Observable<Socket | undefined>;

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

        return `http://${settings.host}:${settings.port}`;
      }),
      distinctUntilChanged(),
      map((url) => url ? new Socket({ url }) : undefined),
      shareReplay(1),
    )
  }

  public getSocket(): Promise<Socket | undefined> {
    return firstValueFrom(this.socket$);
  }

  /** Listens to all events. */
  public fromAny<T extends AnySocketEvent>(): Observable<T>;
  /** Listens to any of the specified events. */
  public fromAny<T extends AnySocketEvent>(...eventNames: T["event"][]): Observable<T>;
  public fromAny<T extends AnySocketEvent>(...eventNames: T["event"][]): Observable<T> {
    const names = eventNames.length ? new Set(eventNames) : undefined;

    return this.socket$.pipe(
      filter((socket) => !!socket),
      switchMap((socket) => {
        return new Observable<T>((observer: Observer<T>) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const listener = (event: string, ...args: any[]) => {
            if (!names || names.has(event)) {
              observer.next({
                event,
                args: args.length < 2 ? args[0] : args,
              } as T);
            }
          };

          socket.onAny(listener);
          return () => {
            socket.ioSocket.offAny(listener);
          };
        });
      }),
    );
  }

  public fromEvent<T = unknown>(fromEvent: string) {
    return this.socket$.pipe(
      filter((socket) => !!socket),
      switchMap((socket) => socket.fromEvent<T>(fromEvent)),
    );
  }
}
