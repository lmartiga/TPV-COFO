import { TestBed, inject } from '@angular/core/testing';

import { CashEntryInternalService } from './cash-entry-internal.service';

describe('CashEntryInternalService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CashEntryInternalService]
    });
  });

  it('should be created', inject([CashEntryInternalService], (service: CashEntryInternalService) => {
    expect(service).toBeTruthy();
  }));
});
