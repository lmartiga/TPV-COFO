import { TestBed, inject } from '@angular/core/testing';

import { DocumentSeriesService } from './document-series.service';

describe('TicketSerieService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [DocumentSeriesService]
    });
  });

  it('should be created', inject([DocumentSeriesService], (service: DocumentSeriesService) => {
    expect(service).toBeTruthy();
  }));
});
