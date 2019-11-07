import { TestBed, inject } from '@angular/core/testing';

import { SlideOverService } from 'app/services/slide-over.service';

describe('SlideOverService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [SlideOverService]
    });
  });

  it('should be created', inject([SlideOverService], (service: SlideOverService) => {
    expect(service).toBeTruthy();
  }));
});
