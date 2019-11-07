import { TestBed, inject } from '@angular/core/testing';

import { LoyaltyService } from './loyalty.service';

describe('LayoutBuilderServiceService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [LoyaltyService]
    });
  });

  it('should be created', inject([LoyaltyService], (service: LoyaltyService) => {
    expect(service).toBeTruthy();
  }));
});
