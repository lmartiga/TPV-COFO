import { TestBed, inject } from '@angular/core/testing';

import { DocumentSearchInternalService } from './document-search-internal.service';

describe('DocumentSearchInternalService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [DocumentSearchInternalService]
    });
  });

  it('should be created', inject([DocumentSearchInternalService], (service: DocumentSearchInternalService) => {
    expect(service).toBeTruthy();
  }));
});
