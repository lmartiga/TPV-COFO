import { TestBed, inject } from '@angular/core/testing';

import { FuellingPointTestService } from './fuelling-point-test.service';

describe('FuellingPointTestService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [FuellingPointTestService]
    });
  });

  it('should be created', inject([FuellingPointTestService], (service: FuellingPointTestService) => {
    expect(service).toBeTruthy();
  }));
});
