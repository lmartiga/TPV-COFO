import { TestBed, inject } from '@angular/core/testing';

import { FuellingPointsSignalrUpdatesService } from './fuelling-points-signalr-updates.service';

describe('FuellingPointsSignalrUpdatesService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [FuellingPointsSignalrUpdatesService]
    });
  });

  it('should be created', inject([FuellingPointsSignalrUpdatesService], (service: FuellingPointsSignalrUpdatesService) => {
    expect(service).toBeTruthy();
  }));
});
