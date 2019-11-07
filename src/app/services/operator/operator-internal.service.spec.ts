import { TestBed, inject } from '@angular/core/testing';

import { OperatorInternalService } from './operator-internal.service';

describe('OperatorInternalService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [OperatorInternalService]
    });
  });

  it('should be created', inject([OperatorInternalService], (service: OperatorInternalService) => {
    expect(service).toBeTruthy();
  }));
});
