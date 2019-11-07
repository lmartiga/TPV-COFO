import { TestBed, inject } from '@angular/core/testing';

import { CreditCardPaymentService } from './credit-card-payment.service';

describe('CreditCardPaymentService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CreditCardPaymentService]
    });
  });

  it('should be created', inject([CreditCardPaymentService], (service: CreditCardPaymentService) => {
    expect(service).toBeTruthy();
  }));
});
