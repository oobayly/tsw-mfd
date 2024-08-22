import { TestBed } from '@angular/core/testing';

import { MfdControlsService } from './mfd-controls.service';

describe('MfdControlsService', () => {
  let service: MfdControlsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MfdControlsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
