import { TestBed, inject } from '@angular/core/testing';

import { CashOutInternalService } from './cash-out-internal.service';

describe('CashOutInternalService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CashOutInternalService]
    });
  });

  it('should be created', inject([CashOutInternalService], (service: CashOutInternalService) => {
    expect(service).toBeTruthy();
  }));
});
