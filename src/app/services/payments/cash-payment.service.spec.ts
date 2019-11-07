import { TestBed, inject } from '@angular/core/testing';

import { CashPaymentService } from './cash-payment.service';

describe('CashPaymentService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CashPaymentService]
    });
  });

  it('should be created', inject([CashPaymentService], (service: CashPaymentService) => {
    expect(service).toBeTruthy();
  }));
});
