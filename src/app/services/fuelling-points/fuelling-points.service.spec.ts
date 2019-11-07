import { TestBed, inject } from '@angular/core/testing';

import { FuellingPointsService } from './fuelling-points.service';

describe('FuellingPointsService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [FuellingPointsService]
    });
  });

  it('should be created', inject([FuellingPointsService], (service: FuellingPointsService) => {
    expect(service).toBeTruthy();
  }));
});
