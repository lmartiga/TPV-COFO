import { TestBed, inject } from '@angular/core/testing';

import { KeyboardInternalService } from './keyboard-internal.service';

describe('KeyboardInternalService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [KeyboardInternalService]
    });
  });

  it('should be created', inject([KeyboardInternalService], (service: KeyboardInternalService) => {
    expect(service).toBeTruthy();
  }));
});
