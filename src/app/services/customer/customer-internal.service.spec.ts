import { TestBed, inject } from '@angular/core/testing';

import { CustomerInternalService } from './customer-internal.service';

describe('CustomerInternalService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CustomerInternalService]
    });
  });

  it('should be created', inject([CustomerInternalService], (service: CustomerInternalService) => {
    expect(service).toBeTruthy();
  }));
});
