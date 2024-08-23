import { CommonModule } from "@angular/common";
import { AfterViewInit, Component, inject } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule } from "@angular/forms";
import { NgbActiveModal } from "@ng-bootstrap/ng-bootstrap";
import { SetttingsService } from "../../../../core/services/setttings.service";

interface FormValues {
  brightness: FormControl<number>;
}

@Component({
  selector: 'app-map-settings-modal',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule
  ],
  templateUrl: './map-settings-modal.component.html',
  styleUrl: './map-settings-modal.component.scss'
})
export class MapSettingsModalComponent implements AfterViewInit {
  public readonly activeModal = inject(NgbActiveModal);

  private readonly settingsService = inject(SetttingsService);

  public readonly form = this.buildForm();

  async ngAfterViewInit(): Promise<void> {
    const settings = await this.settingsService.getSettingAsync("map");

    this.form.patchValue({
      brightness: settings?.brightness ?? 1,
    });
    this.form.markAsPristine();
    this.form.markAsUntouched();
  }

  public buildForm(): FormGroup<FormValues> {
    const fb = inject(FormBuilder);

    return fb.group({
      brightness: fb.control(1, { nonNullable: true }),
    });
  }

  public async onSaveClick(): Promise<void> {
    if (this.form.invalid) {
      return;
    }

    const { brightness } = this.form.value;

    await this.settingsService.patchSetting("map", {
      brightness: brightness!
    });

    this.activeModal.close();
  }
}
