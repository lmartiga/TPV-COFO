import { TestBed, inject } from '@angular/core/testing';

import { CashEntryService } from './cash-entry.service';

describe('CashEntryService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CashEntryService]
    });
  });

  it('should be created', inject([CashEntryService], (service: CashEntryService) => {
    expect(service).toBeTruthy();
  }));
});
