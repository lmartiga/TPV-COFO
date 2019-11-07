import { TestBed, inject } from '@angular/core/testing';

import { SessionInternalService } from './session-internal.service';

describe('SessionInternalService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [SessionInternalService]
    });
  });

  it('should be created', inject([SessionInternalService], (service: SessionInternalService) => {
    expect(service).toBeTruthy();
  }));
});
