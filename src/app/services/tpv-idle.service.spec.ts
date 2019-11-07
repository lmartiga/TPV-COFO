import { TestBed, inject } from '@angular/core/testing';

import { TpvIdleService } from './tpv-idle.service';

describe('TpvIdleService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [TpvIdleService]
    });
  });

  it('should be created', inject([TpvIdleService], (service: TpvIdleService) => {
    expect(service).toBeTruthy();
  }));
});
