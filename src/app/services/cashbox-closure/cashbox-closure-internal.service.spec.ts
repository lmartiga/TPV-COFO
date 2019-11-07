import { TestBed, inject } from '@angular/core/testing';

import { CashboxClosureInternalService } from './cashbox-closure-internal.service';

describe('CashboxClosureInternalService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CashboxClosureInternalService]
    });
  });

  it('should be created', inject([CashboxClosureInternalService], (service: CashboxClosureInternalService) => {
    expect(service).toBeTruthy();
  }));
});
