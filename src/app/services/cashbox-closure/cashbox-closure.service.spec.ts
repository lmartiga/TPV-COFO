import { TestBed, inject } from '@angular/core/testing';

import { CashboxClosureService } from './cashbox-closure.service';

describe('CashboxClosureService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CashboxClosureService]
    });
  });

  it('should be created', inject([CashboxClosureService], (service: CashboxClosureService) => {
    expect(service).toBeTruthy();
  }));
});
