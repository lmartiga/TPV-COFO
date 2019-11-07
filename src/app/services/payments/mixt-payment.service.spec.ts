import { TestBed, inject } from '@angular/core/testing';

import { MixtPaymentService } from './mixt-payment.service';

describe('MixtPaymentService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [MixtPaymentService]
    });
  });

  it('should be created', inject([MixtPaymentService], (service: MixtPaymentService) => {
    expect(service).toBeTruthy();
  }));
});
