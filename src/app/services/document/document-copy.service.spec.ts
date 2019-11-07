import { TestBed, inject } from '@angular/core/testing';

import { DocumentCopyService } from './document-copy.service';

describe('DocumentCopyService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [DocumentCopyService]
    });
  });

  it('should be created', inject([DocumentCopyService], (service: DocumentCopyService) => {
    expect(service).toBeTruthy();
  }));
});
