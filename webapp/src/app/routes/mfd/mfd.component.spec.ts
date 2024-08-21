import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MfdComponent } from './mfd.component';

describe('MfdComponent', () => {
  let component: MfdComponent;
  let fixture: ComponentFixture<MfdComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MfdComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MfdComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
