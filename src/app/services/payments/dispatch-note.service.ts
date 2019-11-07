import { Injectable } from '@angular/core';
import { Document } from 'app/shared/document/document';
import { Observable } from 'rxjs/Observable';
import { Subscriber } from 'rxjs/Subscriber';
import { DocumentSeriesService } from '../document/document-series.service';
import { FinalizingDocumentFlowType } from '../../shared/document/finalizing-document-flow-type.enum';
import { DocumentService } from '../document/document.service';
import { LogHelper } from '../../helpers/log-helper';

@Injectable()
export class DispatchNoteService {

  constructor(
    private documentSeriesSvc: DocumentSeriesService,
    private documentSvc: DocumentService,
    private _logHelper : LogHelper,
  ) { }

  sendDispatchNote(document: Document): Observable<boolean> {
    return Observable.create((observer: Subscriber<boolean>) => {
      if (document == undefined) {
        observer.next(false);
        return;
      }
      try {
        document.series = this.documentSeriesSvc.getSeriesByFlow(FinalizingDocumentFlowType.EmittingDispatchNote, document.totalAmountWithTax);
        this.documentSvc.sendDeliveryNote([document])
          .first().subscribe(sendSaleResult => {
            observer.next(sendSaleResult);
          },
            error => { // no propago error. Capturo, log Error e indico false
              this._logHelper.logError(undefined, error);
              observer.next(false);
            });
      } catch (error) {
        this._logHelper.logError(undefined, error);
        observer.next(false);
      }
    });
  }
}
