import { Injectable } from '@angular/core';
import { Socket, SocketIoConfig } from "ngx-socket-io";
import { BehaviorSubject, filter, firstValueFrom, map, Observable, shareReplay, switchMap } from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class TswSocketService {
  // ========================
  // Properties
  // ========================

  private readonly config$ = new BehaviorSubject<SocketIoConfig | undefined>(undefined);

  public readonly socket$: Observable<Socket | undefined> = this.config$.pipe(
    // filter((config): config is SocketIoConfig => !!config),
    map((config) => config ? new Socket(config) : undefined),
    shareReplay(1),
  );

  constructor() {
    window.setTimeout(() => {
      this.config$.next({
        url: "http://localhost:3000"
      });
    }, 10000);
  }

  public getSocket(): Promise<Socket | undefined> {
    return firstValueFrom(this.socket$);
  }

  // public async emit(_eventName: string, ..._args: any[]): Promise<any> {
  //   const socket = this.getSocket();

  //   if (socket)
  //     socket.

  //   return await socket.emit(_eventName, _args);
  // }

  public fromEvent<T = unknown>(fromEvent: string) {
    return this.socket$.pipe(
      filter((socket) => !!socket),
      switchMap((socket) => socket.fromEvent<T>(fromEvent))
    );
  }

  // public async fromOneTimeEvent<T = unknown>(fromEvent: string): Promise<T> {
  //   const socket = await firstValueFrom(this.socket$);

  //   return await socket.fromOneTimeEvent<T>(fromEvent);
  // }
}
