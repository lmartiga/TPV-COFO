import { Component, OnInit, Input, HostBinding} from '@angular/core';
import { Subject } from 'rxjs/Subject';
import { Observable } from 'rxjs/Observable';

import { IActionFinalizable } from 'app/shared/iaction-finalizable';
import { MixtPaymentInternalService } from 'app/services/payments/mixt-payment-internal.service';
import { DocumentSearchFilters } from 'app/shared/document-search/document-search-filters.enum';
import { SearchDocumentMode } from 'app/shared/document-search/search-document-mode.enum';
import { DocumentSearchSelected } from 'app/shared/document-search/document-search-selected';
import { PaymentPurpose } from 'app/shared/payments/PaymentPurpose.enum';
import { DocumentService } from '../../../../services/document/document.service';
import { AppDataConfiguration } from 'app/config/app-data.config';
import { LanguageService } from 'app/services/language/language.service';
import { CustomerInternalService } from 'app/services/customer/customer-internal.service';
import { LogHelper } from 'app/helpers/log-helper';
@Component({
  selector: 'tpv-cobros',
  templateUrl: './collections.component.html',
  styleUrls: ['./collections.component.scss']
})
export class CollectionsComponent implements OnInit, IActionFinalizable<boolean> {
  @HostBinding('class') class = 'tpv-cobros';
  @Input() isRunawayDebt: boolean;

  private _collectionCompleted: Subject<boolean> = new Subject();
  private _documentSearchFilters: Array<DocumentSearchFilters>;
  private _documentSearchMode: SearchDocumentMode;
  constructor(
    private _mixtPaymentInternalService: MixtPaymentInternalService,
    private _customerInternalsrv: CustomerInternalService,
    private _documentService: DocumentService,
    private _appDataConfig: AppDataConfiguration,
    private _languageService : LanguageService,
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
  onDocumentSelected(documentSearchSelected: DocumentSearchSelected) {
    if (document != undefined) {
      // documentSearchSelected.documentSelected.customer = undefined;
      if (this._customerInternalsrv.currentCustomer !== undefined) {
        documentSearchSelected.documentSelected.customer = this._customerInternalsrv.currentCustomer;
      }

      documentSearchSelected.documentSelected.paymentDetails.find(p => p.paymentMethodId === this._appDataConfig.company.id + '09') !== undefined ?
      documentSearchSelected.documentSelected.isRunAway = true : documentSearchSelected.documentSelected.isRunAway = false;
      this._documentService.SetDocumentPagoPendiente(documentSearchSelected.documentSelected);
      this._logHelper.trace('Pedimos pago mixto');
      this._mixtPaymentInternalService.requestMixtPaymentSale(documentSearchSelected.documentSelected, PaymentPurpose.PendingPayment, false)
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
    ret.setDate(ret.getDate() - 7);
    return ret;
  }

  getLiteral(group: string, key: string): string {
    return this._languageService.getLiteral(group, key);
  }
}
