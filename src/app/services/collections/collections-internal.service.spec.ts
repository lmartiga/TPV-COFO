import { TestBed, inject } from '@angular/core/testing';

import { CollectionsInternalService } from './collections-internal.service';

describe('CollectionsInternalService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CollectionsInternalService]
    });
  });

  it('should be created', inject([CollectionsInternalService], (service: CollectionsInternalService) => {
    expect(service).toBeTruthy();
  }));
});
