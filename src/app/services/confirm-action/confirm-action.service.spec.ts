import { TestBed, inject } from '@angular/core/testing';

import { ConfirmActionService } from './confirm-action.service';

describe('ConfirmActionService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ConfirmActionService]
    });
  });

  it('should be created', inject([ConfirmActionService], (service: ConfirmActionService) => {
    expect(service).toBeTruthy();
  }));
});
