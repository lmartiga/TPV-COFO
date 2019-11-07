import { TestBed, inject } from '@angular/core/testing';

import { CashboxClosureServiceOffline } from './cashbox-closure-offline.service';

describe('CashboxClosureService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CashboxClosureServiceOffline]
    });
  });

  it('should be created', inject([CashboxClosureServiceOffline], (service: CashboxClosureServiceOffline) => {
    expect(service).toBeTruthy();
  }));
});
