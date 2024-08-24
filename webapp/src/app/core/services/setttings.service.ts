import { EventEmitter, Injectable } from '@angular/core';
import { NgxIndexedDBService } from "ngx-indexed-db";
import { catchError, filter, firstValueFrom, map, Observable, of, startWith, switchMap } from "rxjs";

interface SettingsMap {
  map: { lat: number, lng: number, zoom: number, layers: string[], brightness: number },
  websocket: { host: string, port: number },
}

export type SettingsKey = keyof SettingsMap;

@Injectable({
  providedIn: 'root'
})
export class SetttingsService {
  private readonly storeName = "settings";

  /** The event that is emitted when a setting is written to. */
  public readonly settingChange$ = new EventEmitter<keyof SettingsMap>();

  constructor(
    private readonly db: NgxIndexedDBService,
  ) { }

  public getSetting<T extends keyof SettingsMap>(settingName: T): Observable<Partial<SettingsMap[T]> | undefined> {
    return this.db.getByKey<Partial<SettingsMap[T]> & { name: string }>(this.storeName, settingName).pipe(
      map((x) => {
        const { name, ...value } = x;

        return value as unknown as Partial<SettingsMap[T]>;
      }),
      catchError((_) => of(undefined)),
    );
  }

  public getSettingAsync<T extends keyof SettingsMap>(settingName: T): Promise<Partial<SettingsMap[T]> | undefined> {
    return firstValueFrom(this.getSetting(settingName));
  }

  public async patchSetting<T extends keyof SettingsMap>(settingName: T, value: Partial<SettingsMap[T]>): Promise<void> {
    const current = await this.getSettingAsync(settingName);

    await firstValueFrom(
      this.db.update(this.storeName, { ...current, ...value, name: settingName })
    );

    this.settingChange$.next(settingName);
  }

  public watchSetting<T extends keyof SettingsMap>(settingName: T): Observable<Partial<SettingsMap[T]> | undefined> {
    return this.settingChange$.pipe(
      filter((k) => k === settingName),
      startWith(undefined),
      switchMap(() => this.getSetting(settingName)),
    );
  }
}
