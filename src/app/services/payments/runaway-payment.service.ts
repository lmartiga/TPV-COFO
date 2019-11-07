import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { Subscriber } from 'rxjs/Subscriber';
import { FormatHelper } from 'app/helpers/format-helper';
import { DocumentSeriesService } from 'app/services/document/document-series.service';
import { DocumentService } from 'app/services/document/document.service';
import { Document } from 'app/shared/document/document';
import { AppDataConfiguration } from 'app/config/app-data.config';
import { PaymentMethodType } from 'app/shared/payments/payment-method-type.enum';
import { FinalizingDocumentFlowType } from 'app/shared/document/finalizing-document-flow-type.enum';
import { RunawayData } from 'app/shared/runaway-data';
import { StatusBarService } from 'app/services/status-bar/status-bar.service';
import { ConfirmActionService } from '../confirm-action/confirm-action.service';
import { ConfirmActionType } from '../../shared/confirmAction/confirm-action-type.enum';
import { LanguageService } from 'app/services/language/language.service';
import { DocumentInternalService } from 'app/services/document/document-internal.service';
import { ElectronicJournalService } from 'app/services/electronic-journal/electronic-journal.service';
import { ActionType } from 'app/shared/electronic-journal/action-type.enum';

@Injectable()
export class RunawayPaymentService {

  constructor(
    private _seriesService: DocumentSeriesService,
    private _documentService: DocumentService,
    private _appDataConfig: AppDataConfiguration,
    private _statusBarService: StatusBarService,
    private _confirmActionSvc: ConfirmActionService,
    private _languageService: LanguageService,
    private _documentInternalService: DocumentInternalService,
    private _electronicJournal: ElectronicJournalService,
  ) {
  }

  existsRunawayPaymentMethod(): boolean {
    const runawayPM = this._appDataConfig.getPaymentMethodByType(PaymentMethodType.runaway);
    if (runawayPM == undefined) {
      this._confirmActionSvc.promptActionConfirm(
        this.getLiteral('runaway_payment_service','runawayPaymentMethod_MissingConfiguration'),
        this.getLiteral('runaway_payment_service','runawayPaymentMethod_Accept'), undefined, 
        this.getLiteral('runaway_payment_service','runawayPaymentMethod_Error'), ConfirmActionType.Error)
        .first().subscribe(); // ignoramos la salida del cuadro informativo
      this._statusBarService.publishMessage(this.getLiteral('runaway_payment_service','statusBar_runawayPaymentMethod_MissingConfiguration'));
      return false;
    }
    return true;
  }

  sendRunawayPayment(document: Document, runawayData: RunawayData): Observable<boolean> {
    return Observable.create((observer: Subscriber<boolean>) => {
      const runawayPM = this._appDataConfig.getPaymentMethodByType(PaymentMethodType.runaway);
      const remarks = runawayData != undefined ? runawayData.remarks != undefined ? runawayData.remarks.toString() : '' : '';
      const plate = runawayData != undefined ? runawayData.plate != undefined ? runawayData.plate.toString() : '' : '';
      document.paymentDetails = [{
        paymentMethodId: runawayPM.id,
        paymentDateTime: FormatHelper.formatToUTCDateFromLocalDate(new Date()),
        currencyId: document.currencyId,
        primaryCurrencyGivenAmount: document.totalAmountWithTax,
        primaryCurrencyTakenAmount: document.totalAmountWithTax,
        secondaryCurrencyTakenAmount: document.totalAmountWithTax,
        secondaryCurrencyGivenAmount: document.totalAmountWithTax,
        changeFactorFromBase: 1,
        extraData: {
          ['Remarks']: runawayData != undefined ? runawayData.remarks != undefined ? runawayData.remarks.toString() : '' : '',
          ['Plate']: runawayData != undefined ? runawayData.plate != undefined ? runawayData.plate.toString() : '' : ''
        }
      }];

        // Electronic Journal - paymentAdded
        this._electronicJournal.writeAction({
          type: ActionType.paymentAdded,
          selectedDocument: this._documentInternalService.currentDocumentIndex.toString(),
          paymentMode: runawayPM.type,
          amount: '0',
          paymentDescription: runawayPM.description,
          genericDetail: `plate: '${plate}', remarks: '${remarks}'`,
        });
  
      document.plate = runawayData != undefined ? runawayData.plate != undefined ? runawayData.plate.toString() : '' : '';
      document.isRunAway = true;
      document.series = this._seriesService.getSeriesByFlow(FinalizingDocumentFlowType.EmittingTicket, 0);
      // document.paymentDetails[0].primaryCurrencyGivenAmount = 0.01;
      // document.paymentDetails[0].primaryCurrencyTakenAmount = 0.01;
      // document.paymentDetails[0].secondaryCurrencyGivenAmount = 0.01;
      // document.paymentDetails[0].secondaryCurrencyTakenAmount = 0.01;
      // document.totalAmountWithTax = 0.01;
      // document.totalTaxableAmount = 0.01;
      // document.taxableAmount = 0.01;
      this._documentService.sendRunawayDocuments(new Array<Document>(document))
        .first().subscribe(response => {
          setTimeout(() => {
            this._statusBarService.resetProgress();
          }, 3000);
          document.isRunAway = false;
          observer.next(response);
        });
    });
  }

  getLiteral(group: string, key: string): string {
    return this._languageService.getLiteral(group, key);
  }
}
