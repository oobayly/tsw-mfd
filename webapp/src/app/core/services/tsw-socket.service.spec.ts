import { TestBed } from "@angular/core/testing";

import { TswSocketService } from "./tsw-socket.service";

describe("TswSocketService", () => {
  let service: TswSocketService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TswSocketService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });
});
