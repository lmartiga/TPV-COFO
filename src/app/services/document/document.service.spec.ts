import { TestBed, inject } from '@angular/core/testing';

import { DocumentService } from './document.service';
import { HttpService } from 'app/services/http/http.service';
import { Http } from '@angular/http';

describe('DocumentService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [DocumentService, HttpService, Http]
    });
  });

  it('should be created', inject([DocumentService, HttpService, Http], (service: DocumentService) => {
    expect(service).toBeTruthy();
  }));
});
