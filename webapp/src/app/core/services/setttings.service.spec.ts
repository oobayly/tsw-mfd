import { TestBed } from '@angular/core/testing';

import { SetttingsService } from './setttings.service';

describe('SetttingsService', () => {
  let service: SetttingsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SetttingsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
