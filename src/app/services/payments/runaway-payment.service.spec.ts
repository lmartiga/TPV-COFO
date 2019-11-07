import { TestBed, inject } from '@angular/core/testing';

import { RunawayPaymentService } from './runaway-payment.service';

describe('RunawayPaymentService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [RunawayPaymentService]
    });
  });

  it('should be created', inject([RunawayPaymentService], (service: RunawayPaymentService) => {
    expect(service).toBeTruthy();
  }));
});
