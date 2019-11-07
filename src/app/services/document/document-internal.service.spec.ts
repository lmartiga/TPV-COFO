import { TestBed, inject } from '@angular/core/testing';

import { DocumentInternalService } from './document-internal.service';

describe('DocumentInternalService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [DocumentInternalService]
    });
  });

  it('should be created', inject([DocumentInternalService], (service: DocumentInternalService) => {
    expect(service).toBeTruthy();
  }));
});
