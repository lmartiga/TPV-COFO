import { TestBed, inject } from '@angular/core/testing';

import { FuellingPointTestInternalService } from './fuelling-point-test-internal.service';

describe('FuellingPointTestInternalService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [FuellingPointTestInternalService]
    });
  });

  it('should be created', inject([FuellingPointTestInternalService], (service: FuellingPointTestInternalService) => {
    expect(service).toBeTruthy();
  }));
});
