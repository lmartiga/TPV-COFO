import { Injectable } from '@angular/core';
import { IdocumentConfirmActions } from 'app/shared/idocument-confirm-actions';
import { Observable } from 'rxjs/Observable';
import { Subscriber } from 'rxjs/Subscriber';
import { Document } from 'app/shared/document/document';
import { FuellingPointsService } from './fuelling-points.service';
import { FuellingPointSupplyLine } from '../../shared/fuelling-point/fuelling-point-supply-line';
import { FuellingPointPrepaidLine } from '../../shared/fuelling-point/fuelling-point-prepaid-line';

@Injectable()
export class FuellingPointsDocumentConfirmActionsService extends IdocumentConfirmActions {

  constructor(
    private _fpSvc: FuellingPointsService
  ) {
    super();
  }
  /**
   * Confirma las transacciones que pudiera haber en el documento
   * @param document documento sobre el que comprobar las transaciones
   */
  onSendComplete(document: Document): Observable<boolean> {
    return Observable.create((observer: Subscriber<boolean>) => {
      const idsSupplyTransactions: Array<string> = [];
      const idsPrepaidTransactions: Array<string> = [];
      const arrConfirmOperations: Array<Observable<boolean>> = [];
      const businessSpecificLines = document.lines.filter(line => line.businessSpecificLineInfo != undefined);
      for (const line of businessSpecificLines) {
        const bsl = line.businessSpecificLineInfo;
        if (bsl instanceof FuellingPointSupplyLine) {
          const supplyLine = bsl as FuellingPointSupplyLine;
          if (supplyLine.idTransaction != undefined) {
            idsSupplyTransactions.push(supplyLine.idTransaction);
          }
        }
        if (bsl instanceof FuellingPointPrepaidLine) {
          const prepaidLine = bsl as FuellingPointPrepaidLine;
          idsPrepaidTransactions.push(prepaidLine.idTransaction);
        }
      }
      if ( idsSupplyTransactions.length > 0
        && (document.ticketFactura == undefined || document.ticketFactura != true) ) {
        arrConfirmOperations.push(this._fpSvc.setDefinitiveDocumentIdForSupplyTransactions(
          document.documentId,
          idsSupplyTransactions
        ));
      }
      if (idsPrepaidTransactions.length > 0) {
        arrConfirmOperations.push(this._fpSvc.setDefinitiveDocumentIdForPrepaidOperations(
          document.documentId,
          idsPrepaidTransactions
        ));
      }
      if (arrConfirmOperations.length > 0) {
        Observable.zip(...arrConfirmOperations)
          .first().subscribe((zipResponses: Array<boolean>) => {
            for (const response of zipResponses) {
              if (!response) {
                return observer.next(false);
              }
            }
            return observer.next(true);
          },
            error => {
              observer.next(false);
            });
      } else {
        observer.next(true);
      }
    });
  }
}
