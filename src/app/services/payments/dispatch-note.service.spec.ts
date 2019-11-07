import { TestBed, inject } from '@angular/core/testing';

import { DispatchNoteService } from './dispatch-note.service';

describe('DispatchNoteService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [DispatchNoteService]
    });
  });

  it('should be created', inject([DispatchNoteService], (service: DispatchNoteService) => {
    expect(service).toBeTruthy();
  }));
});
