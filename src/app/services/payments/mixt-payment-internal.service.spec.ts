import { TestBed, inject } from '@angular/core/testing';
import { MixtPaymentInternalService } from './mixt-payment-internal.service';

describe('MixtPaymentInternalService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [MixtPaymentInternalService]
    });
  });

  it('should be created', inject([MixtPaymentInternalService], (service: MixtPaymentInternalService) => {
    expect(service).toBeTruthy();
  }));
});
