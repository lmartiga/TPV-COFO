import { TestBed, inject } from '@angular/core/testing';

import { CashboxClosureInternalServiceOffline } from './cashbox-closure-internal-offline.service';

describe('CashboxClosureInternalService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CashboxClosureInternalServiceOffline]
    });
  });

  it('should be created', inject([CashboxClosureInternalServiceOffline], (service: CashboxClosureInternalServiceOffline) => {
    expect(service).toBeTruthy();
  }));
});
