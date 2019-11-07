import { TestBed, inject } from '@angular/core/testing';

import { AuthorizationInternalService } from './authorization-internal.service';

describe('AuthorizationInternalService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [AuthorizationInternalService]
    });
  });

  it('should be created', inject([AuthorizationInternalService], (service: AuthorizationInternalService) => {
    expect(service).toBeTruthy();
  }));
});
