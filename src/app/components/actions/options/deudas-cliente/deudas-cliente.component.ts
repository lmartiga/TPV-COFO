import { Component, OnInit, Input, HostBinding} from '@angular/core';
import { Subject } from 'rxjs/Subject';
import { Observable } from 'rxjs/Observable';

import { IActionFinalizable } from 'app/shared/iaction-finalizable';
import { MixtPaymentInternalService } from 'app/services/payments/mixt-payment-internal.service';
import { DocumentSearchFilters } from 'app/shared/document-search/document-search-filters.enum';
import { SearchDocumentMode } from 'app/shared/document-search/search-document-mode.enum';
import { DocumentSearchMassive } from 'app/shared/document-search/document-search-massive';
import { PaymentPurpose } from 'app/shared/payments/PaymentPurpose.enum';
import { DocumentService } from '../../../../services/document/document.service';
// import { AppDataConfiguration } from 'app/config/app-data.config';
import { LanguageService } from 'app/services/language/language.service';
import { LogHelper } from 'app/helpers/log-helper';
@Component({
  selector: 'tpv-cobros-deuda',
  templateUrl: './deudas-cliente.component.html',
  styleUrls: ['./deudas-cliente.component.scss']
})
export class DeudasClienteComponent implements OnInit, IActionFinalizable<boolean> {
  @HostBinding('class') class = 'tpv-cobros-deuda';
  @Input() isRunawayDebt: boolean;

  private _collectionCompleted: Subject<boolean> = new Subject();
  private _documentSearchFilters: Array<DocumentSearchFilters>;
  private _documentSearchMode: SearchDocumentMode;
  constructor(
    private _mixtPaymentInternalService: MixtPaymentInternalService,
    private _documentService: DocumentService,
   // private _appDataConfig: AppDataConfiguration,
    private _languageService: LanguageService,
    private  _logHelper: LogHelper
  ) {
  }

  ngOnInit() {
    if (this.isRunawayDebt) {
      this._documentSearchFilters = [
        DocumentSearchFilters.debt,
        DocumentSearchFilters.document,
        DocumentSearchFilters.operator,
        DocumentSearchFilters.plate,
        DocumentSearchFilters.date,
        DocumentSearchFilters.import,
      ];
      this._documentSearchMode = SearchDocumentMode.Runaway;
    } else {
      this._documentSearchFilters = [
        DocumentSearchFilters.debt,
        DocumentSearchFilters.document,
        DocumentSearchFilters.customer,
        DocumentSearchFilters.date,
        DocumentSearchFilters.import
      ];
      this._documentSearchMode = SearchDocumentMode.Pending;
    }
  }

  onFinish(): Observable<boolean> {
    return this._collectionCompleted.asObservable();
  }

  forceFinish(): void {
    this._collectionCompleted.next(false);
  }
  set isRunaway(isRunaway: boolean) {
    this.isRunawayDebt = isRunaway;
  }
  set documentSearchFilters(filters: Array<DocumentSearchFilters>) {
    this._documentSearchFilters = filters;
  }

  get documentSearchFilters(): Array<DocumentSearchFilters> {
    return this._documentSearchFilters;
  }
  get documentSearchMode(): SearchDocumentMode {
    return this._documentSearchMode;
  }
  onDocumentSelected(documentSearchSelectedMassive: DocumentSearchMassive) {
    if (document != undefined) {

      this._documentService.SetDocumentsPagosPendientes(documentSearchSelectedMassive.documentsSelected);
      this._logHelper.trace('Pedimos pago mixto');
      this._mixtPaymentInternalService.requestMixtPaymentSaleMassive(documentSearchSelectedMassive.documentsSelected,
         PaymentPurpose.PendingPayment, documentSearchSelectedMassive.cliente)
        .first()
        .subscribe(
        success => {
          if (success) {
            // this._documentInternalService.deleteDocumentData(); // TODO: ¿Esto hay que hacerlo?
            this._collectionCompleted.next(true);
          } else {
            // this._documentInternalService.deleteDocumentData(); // TODO: ¿Esto hay que hacerlo?
            this._collectionCompleted.next(false);
          }
        },
        err => {
          this._logHelper.trace(err);
          this._collectionCompleted.next(false);
        });
    }
  }
  get defaultRecentDateCollection(): Date  {
    const ret = new Date();
    //ret.setDate(ret.getDate() - 7); se comenta para que aparezca la fecha de hoy
    return ret;
  }

  getLiteral(group: string, key: string): string {
    return this._languageService.getLiteral(group, key);
  }
}
