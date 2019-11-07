
import { TestBed, async, inject } from '@angular/core/testing';
import { DocumentCancellationParcialService } from './document-cancellation-parcial.service';

describe('Service: DocumentCancellationParcial', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [DocumentCancellationParcialService]
    });
  });

  it('should ...', inject([DocumentCancellationParcialService], (service: DocumentCancellationParcialService) => {
    expect(service).toBeTruthy();
  }));
});
