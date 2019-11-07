import { TestBed, inject } from '@angular/core/testing';

import { AuxiliarActionsManagerService } from './auxiliar-actions-manager.service';

describe('AuxiliarActionsManagerService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [AuxiliarActionsManagerService]
    });
  });

  it('should be created', inject([AuxiliarActionsManagerService], (service: AuxiliarActionsManagerService) => {
    expect(service).toBeTruthy();
  }));
});
