import { Injectable } from '@angular/core';
import { extend } from "leaflet";
import { NgxIndexedDBService } from "ngx-indexed-db";
import { catchError, firstValueFrom, map, Observable, of } from "rxjs";

interface SettingsMap {
  map: { lat: number, lng: number, zoom: number, layers: string[] },
}

type Setting<T extends keyof SettingsMap> = SettingsMap[T] & { name: string };

@Injectable({
  providedIn: 'root'
})
export class SetttingsService {
  private readonly storeName = "settings";

  constructor(
    private readonly db: NgxIndexedDBService,
  ) { }

  public getSetting<T extends keyof SettingsMap>(settingName: T): Observable<SettingsMap[T] | undefined> {
    return this.db.getByKey<Setting<T>>(this.storeName, settingName).pipe(
      map((x) => {
        const { name, ...value } = x;

        return value;
      }),
      catchError((e) => of(undefined)),
    );
  }

  public getSettingAsync<T extends keyof SettingsMap>(settingName: T): Promise<SettingsMap[T] | undefined> {
    return firstValueFrom(this.getSetting(settingName));
  }

  public async updateSetting<T extends keyof SettingsMap>(settingName: T, value: SettingsMap[T]): Promise<void> {
    const exists = !!await this.getSettingAsync(settingName);

    await firstValueFrom(
      this.db[exists ? "update" : "add"](this.storeName, { ...value, name: settingName })
    );
  }
}
