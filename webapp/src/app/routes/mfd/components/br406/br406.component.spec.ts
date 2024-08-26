import { ComponentFixture, TestBed } from "@angular/core/testing";

import { Br406Component } from "./br406.component";

describe("Br406Component", () => {
  let component: Br406Component;
  let fixture: ComponentFixture<Br406Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Br406Component],
    })
      .compileComponents();

    fixture = TestBed.createComponent(Br406Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
