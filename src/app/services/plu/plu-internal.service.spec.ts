import { TestBed, inject } from '@angular/core/testing';

import { PluInternalService } from './plu-internal.service';

describe('PluInternalService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [PluInternalService]
    });
  });

  it('should be created', inject([PluInternalService], (service: PluInternalService) => {
    expect(service).toBeTruthy();
  }));
});
