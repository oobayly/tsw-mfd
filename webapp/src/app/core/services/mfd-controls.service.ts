import { EventEmitter, Injectable } from "@angular/core";
import { map } from "rxjs";

export interface MfdOptions {
  hasSelfTest: boolean;
  name: string;
}

@Injectable({
  providedIn: "root",
})
export class MfdControlsService {
  // ========================
  // Observables
  // ========================

  public readonly mfd$ = new EventEmitter<MfdOptions | undefined>();

  public readonly selfTest$ = new EventEmitter<void>();

  // ========================
  // Observables
  // ========================

  public readonly isLoaded$ = this.mfd$.pipe(map((x) => !!x));

  // Run self test on the current MFD
  public runSelfTest(): void {
    this.selfTest$.next();
  }
}
