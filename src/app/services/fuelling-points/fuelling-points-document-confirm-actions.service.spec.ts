import { TestBed, inject } from '@angular/core/testing';

import { FuellingPointsDocumentConfirmActionsService } from './fuelling-points-document-confirm-actions.service';

describe('FuellingPointsDocumentConfirmActionsService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [FuellingPointsDocumentConfirmActionsService]
    });
  });

  it('should be created', inject([FuellingPointsDocumentConfirmActionsService], (service: FuellingPointsDocumentConfirmActionsService) => {
    expect(service).toBeTruthy();
  }));
});
