import { TestBed, inject } from '@angular/core/testing';

import { FuellingPointsInternalService } from './fuelling-points-internal.service';

describe('FuellingPointsInternalService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [FuellingPointsInternalService]
    });
  });

  it('should be created', inject([FuellingPointsInternalService], (service: FuellingPointsInternalService) => {
    expect(service).toBeTruthy();
  }));
});
