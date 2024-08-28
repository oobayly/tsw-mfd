import { CommonModule } from "@angular/common";
import { AfterViewInit, Component, inject } from "@angular/core";
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule } from "@angular/forms";
import { NgbActiveModal } from "@ng-bootstrap/ng-bootstrap";
import { map, Observable, startWith } from "rxjs";
import { SetttingsService } from "../../core/services/setttings.service";

interface FormValues {
  websocket: FormGroup<{
    host: FormControl<string>;
    port: FormControl<number>;
  }>;
  map: FormGroup<{
    brightness: FormControl<number>;
  }>;
}

@Component({
  selector: "app-settings-modal",
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
  ],
  templateUrl: "./settings-modal.component.html",
  styleUrl: "./settings-modal.component.scss",
})
export class SettingsModalComponent implements AfterViewInit {
  // ========================
  // Injected services
  // ========================

  public readonly activeModal = inject(NgbActiveModal);

  private readonly settingsService = inject(SetttingsService);

  // ========================
  // Properties
  // ========================

  public readonly form = this.buildForm();

  public readonly mapBrightness$: Observable<number>;

  // ========================
  // Lifecycle
  // ========================

  constructor() {
    this.mapBrightness$ = this.form.controls.map.controls.brightness.valueChanges.pipe(
      startWith(this.form.controls.map.controls.brightness.value),
      map((x) => x * 100),
    );
  }

  async ngAfterViewInit(): Promise<void> {
    const mapSettings = await this.settingsService.getSettingAsync("map");
    const websocketSettings = await this.settingsService.getSettingAsync("websocket");

    this.form.patchValue({
      map: {
        brightness: mapSettings?.brightness ?? 1,
      },
      websocket: websocketSettings,
    });
    this.form.markAsPristine();
    this.form.markAsUntouched();
  }

  // ========================
  // Methods
  // ========================

  public buildForm(): FormGroup<FormValues> {
    const fb = inject(FormBuilder);

    return fb.group({
      map: fb.group({
        brightness: fb.control(1, { nonNullable: true }),
      }),
      websocket: fb.group({
        host: fb.control("", { nonNullable: true }),
        port: fb.control<number>(3000, { nonNullable: true }),
      }),
    });
  }

  // ========================
  // Event handlers
  // ========================

  public async onSaveClick(): Promise<void> {
    if (this.form.controls.map.valid) {
      await this.settingsService.patchSetting("map", this.form.controls.map.value);
    }

    await this.settingsService.patchSetting("websocket", this.form.controls.websocket.value);

    this.activeModal.close();
  }
}
