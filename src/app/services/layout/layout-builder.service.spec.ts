import { TestBed, inject } from '@angular/core/testing';

import { LayoutBuilderService } from './layout-builder.service';

describe('LayoutBuilderServiceService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [LayoutBuilderService]
    });
  });

  it('should be created', inject([LayoutBuilderService], (service: LayoutBuilderService) => {
    expect(service).toBeTruthy();
  }));
});
