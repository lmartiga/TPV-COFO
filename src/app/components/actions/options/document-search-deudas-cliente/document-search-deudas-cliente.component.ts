import { Component, OnInit, HostBinding, Input, EventEmitter, Output } from '@angular/core';
import { DocumentSearchInternalService } from 'app/services/document/document-search-internal.service';
import { DocumentSearch } from 'app/shared/document-search/document-search';
import { Customer } from 'app/shared/customer/customer';
import { CustomerInternalService } from 'app/services/customer/customer-internal.service';
import { DocumentSearchFilters } from 'app/shared/document-search/document-search-filters.enum';
import { SearchDocument } from 'app/shared/web-api-responses/search-document';
import { StatusBarService } from 'app/services/status-bar/status-bar.service';
import { FormatHelper } from 'app/helpers/format-helper';
import { Currency } from 'app/shared/currency/currency';
import { AppDataConfiguration } from 'app/config/app-data.config';
import { CurrencyPriorityType } from 'app/shared/currency/currency-priority-type.enum';
import { SearchDocumentResponseStatuses } from 'app/shared/web-api-responses/search-document-response-statuses.enum';
// import { GetDocumentResponseStatuses } from 'app/shared/web-api-responses/get-document-response-statuses.enum';
import { SearchDocumentMode } from 'app/shared/document-search/search-document-mode.enum';
import { UsageType } from 'app/shared/document-search/usage-type.enum';
import { DocumentSearchMassive } from 'app/shared/document-search/document-search-massive';
import { LanguageService } from 'app/services/language/language.service';
import { ConfirmActionService } from 'app/services/confirm-action/confirm-action.service';
import { ConfirmActionType } from 'app/shared/confirmAction/confirm-action-type.enum';
import { LogHelper } from 'app/helpers/log-helper';

@Component({
  selector: 'tpv-document-search-deudas-cliente',
  templateUrl: './document-search-deudas-cliente.component.html',
  styleUrls: ['./document-search-deudas-cliente.component.scss']
})
export class DocumentSearchDeudasClienteComponent implements OnInit {
  @HostBinding('class') class = 'tpv-document-search-deudas-cliente';
 // @Output() documentSelected: EventEmitter<DocumentSearchSelected> = new EventEmitter();
  @Output() documentsMassiveSelectedEmir: EventEmitter<DocumentSearchMassive> = new EventEmitter();
  @Input() documentSearchFilters: Array<DocumentSearchFilters>;
  @Input() fromDate: Date;
  @Input() searchMode: SearchDocumentMode;
  private customer: Customer;

  // mostrar columna immporte pendiente
  showDebt: boolean;
  // para poder acceder a enumerado desde la UI
  documentSearchFiltersEnum = DocumentSearchFilters;
  // documentList de la busqueda
  documentList: Array<SearchDocument> = [];
  // mensaje cuando no encuentre resultados
  searchMessage: string;
  // abrir y cerrar el panel de filtros
  filterPanelOpened: boolean;
  // texto de los filtros empleados
  textFilters: string = '';
  document: string = '';
  customerBusinessName: string = '';
  customerId: string = '';
  selectedDocumentIndex: number;
  plate: string = '';
  operator: string;
  fromEmissionDate: Date;
  toEmissionDate: Date;
  fromImport: number;
  toImport: number;
  showValidationError: boolean = false;
  currencyInfo: Currency;
  validationTextError: string;
  usageType: UsageType;
  isSearching = false;
  documentsSelectedMassive: SearchDocument[] = [];
  constructor(
    private _customerInternalService: CustomerInternalService,
    private _documentSearchInternal: DocumentSearchInternalService,
    private _statusBarSvc: StatusBarService,
    private _appDataConfig: AppDataConfiguration,
    private _languageService: LanguageService,
    private _confirmActionSvc: ConfirmActionService,
    private  _logHelper: LogHelper
  ) { }

  ngOnInit() {
    this._logHelper.trace('Filtros en DocumentSearch:');
    this._logHelper.trace(this.documentSearchFilters);
    this.showDebt = this.documentSearchFilters.find((x) => x == DocumentSearchFilters.debt) != undefined;
    this.filterPanelOpened = false; // TODO ver si esto es asi
    if (this.fromDate != undefined) {
      this.fromEmissionDate = this.fromDate;
      // this.searchDocuments();
      this.textFilters = this.getLiteral('document_search_component', 'literal_DocumentFilter_RecentFilters');
    }
    const baseCurrency = this._appDataConfig.currencyList.find(c => c.priorityType == CurrencyPriorityType.base);
    if (baseCurrency != undefined) {
      this.currencyInfo = baseCurrency;
    } else {
      this._logHelper.trace('PreviewDocumentComponent-> WARNING: No se ha podido recuperar la divisa base');
    }
  }

  resetSearch() {
    this.documentList = [];
    this._setTextFilters();
  }

  selectDocuments() {
    if (this.documentsSelectedMassive.length > 0) {
      this.documentsMassiveSelectedEmir.emit({
        documentsSelected: this.documentsSelectedMassive,
        usageType: FormatHelper.SearchDocumentModeToUsageType(SearchDocumentMode.PendingMassive),
        cliente: this.customer
        });
    } else {
      this._confirmActionSvc.promptActionConfirm(this.getLiteral('document_search_component','least_one_debt'),
      this.getLiteral('document_search_component','button_DocumentFilter_OK'), '', this.getLiteral('document_search_component','CustomerDebtCollection'), ConfirmActionType.Error);
    }
  }

  searchDocuments(): void {
    // input validation, at least should have 1 filter active
    this.showValidationError = false;
    if (this.customerBusinessName === undefined || this.customerBusinessName === '' || this.customer === undefined) {
      this.validationTextError = this.getLiteral('document_search_component','select_customer');
  // this.validationTextError = this.getLiteral('document_search_component', 'validation_DocumentFilter_OneFieldRequired');
      this.showValidationError = true;
      return;

   /* if (
      (this.document == undefined || this.document.trim() == '')
      && (this.fromEmissionDate == undefined || this.fromEmissionDate.toString() == '')
      && (this.toEmissionDate == undefined || this.toEmissionDate.toString() == '')
      && (this.plate == undefined || this.plate.trim() == '')
      && (this.fromImport == undefined)
      && (this.toImport == undefined)
      && (this.customerBusinessName == undefined || this.customerBusinessName == '')
    ) {*/
    }

    if (!this._validateDates()) {
      this.showValidationError = true;
      return;
    }

    if (!this._validateImports()) {
      this.showValidationError = true;
      return;
    }
    this.showValidationError = false;
    this.filterPanelOpened = false;
    this._setTextFilters();

    const documentSearchData: DocumentSearch = {
      searchMode: this.searchMode,
      document: this.document,
      fromEmissionDate: this.fromEmissionDate,
      toEmissionDate: this.toEmissionDate,
      plate: this.plate,
      customerId: this.customerId,
      operator: this.operator,
      fromImport: this.fromImport,
      toImport: this.toImport
    };
    if (this.customerBusinessName != undefined && this.customerBusinessName.trim() != '' && this.customer != undefined) {
      documentSearchData.customerId = this.customer.id;
    } else {
      documentSearchData.customerId = undefined;
    }
    this.isSearching = true;
    this._documentSearchInternal.searchDocuments(documentSearchData)
      .first()
      .subscribe(
        response => {
          this.isSearching = false;
          if (response == undefined || response.status != SearchDocumentResponseStatuses.Successful) {
            this.searchMessage = this.getLiteral('document_search_component', 'error_DocumentFilter_SearchingError');
            this._logHelper.trace(response.message);
            if (FormatHelper.formatSearchDocumentResponseStatusesMessage(response.status) !== 'Se ha producido un error.') {
              this._statusBarSvc.publishMessage(FormatHelper.formatSearchDocumentResponseStatusesMessage(response.status));
            }
            return;
          }
          if ( this.searchMode == SearchDocumentMode.Runaway) {
            this.documentList = response.documentList.filter(x => x.pendingAmountWithTax != 0);
          } else {
            this.documentList = response.documentList.filter(x => x.totalAmountWithTax != 0);
          }
          if (response.documentList == undefined || response.documentList.length == 0) {
            this.searchMessage = this.getLiteral('document_search_component', 'message_DocumentFilter_NoResults');
            this.selectedDocumentIndex = -1;
          } else {
            this._logHelper.trace('Nuevos documentos:');
            this._logHelper.trace(this.documentList);
          }

          this.documentsSelectedMassive = response.documentList;

        },
        error => {
          this._logHelper.trace(error);
          this.isSearching = false;
          this.documentList = [];
          this.searchMessage = this.getLiteral('document_search_component', 'error_DocumentFilter_DocumentSearchingError');
          this.selectedDocumentIndex = -1;
        });
  }

  checkedPush(numeroDocumento: string) {
    let doc;
    if ( (doc = this.documentsSelectedMassive.find(x => x.documentNumber === numeroDocumento)) !== undefined) {
       // Por defecto, vienen todos a check. Si existe es que lo estamos "descheckeando"
        const index = this.documentsSelectedMassive.indexOf(doc);
        this.documentsSelectedMassive.splice(index, 1);

    } else {
      // Como no existe en la lista, lo añado
      this.documentsSelectedMassive.push(this.documentList.find(x => x.documentNumber === numeroDocumento));
    }
  }

  getCustomer() {
    this._customerInternalService.requestCustomer(true, false)
      .first()
      .subscribe(customerResult => {
        if (customerResult == undefined) {
          this._logHelper.trace('Cliente recibido en buscar documento: undefined');
          return;
        }
        const customer = customerResult.customer;
        this._logHelper.trace('Cliente recibido en buscar documento:');
        this._logHelper.trace(customer);
        this.customer = customer;
        if (customer != undefined) {
          this.customerBusinessName = customer.businessName;
          this.customerId = customer.id;
        }
      });
  }
  clearCustomer() {
    this.customer = undefined;
    this.customerBusinessName = undefined;
  }

  clearAll() {
     this.document = undefined;
     this.customer = undefined;
     this.customerBusinessName = undefined;
     this.customerId = undefined;
     this.fromDate = undefined;
     this.fromEmissionDate = undefined;
     this.toEmissionDate = undefined;
     this.fromImport = undefined;
     this.toImport = undefined;
     this.showValidationError = false;
  }

  private _setTextFilters() {
    this.textFilters = '';
    for (let i = 0; i < this.documentSearchFilters.length; i++) {
      switch (this.documentSearchFilters[i]) {
        case DocumentSearchFilters.customer:
          if (this.customerBusinessName) {
            this.textFilters +=
            this.getLiteral('document_search_component', 'filtersMessage_DocumentFilter_Customer')
            + ' ' + this.customerBusinessName + '; ' ; // TODO Cliente acaba en ,?
          }
          break;
        case DocumentSearchFilters.document:
          if (this.document) {
            this.textFilters +=
            this.getLiteral('document_search_component', 'filtersMessage_DocumentFilter_Document')
            + ' ' + this.document + '; ' ;
          }
          break;
        case DocumentSearchFilters.plate:
          if (this.plate) {
            this.textFilters +=
            this.getLiteral('document_search_component', 'filtersMessage_DocumentFilter_Plate')
            + ' ' + this.plate + '; ' ;
          }
          break;
        case DocumentSearchFilters.date:
          if (this.fromEmissionDate && this.toEmissionDate) {
            this.textFilters += ' ' +
            this.getLiteral('document_search_component', 'filtersMessage_DocumentFilter_From') + ' '
            + this.fromEmissionDate.toLocaleDateString() + ' ' +
            this.getLiteral('document_search_component', 'filtersMessage_DocumentFilter_To') + ' '
            + this.toEmissionDate.toLocaleDateString() + '; ' ;
          } else {
            if (this.fromEmissionDate) {
              this.textFilters += ' ' +
              this.getLiteral('document_search_component', 'filtersMessage_DocumentFilter_From') + ' '
              + this.fromEmissionDate.toLocaleDateString() + '; ';
            }
            if (this.toEmissionDate) {
              this.textFilters += ' ' +
              this.getLiteral('document_search_component', 'filtersMessage_DocumentFilter_To') + ' '
              + this.toEmissionDate.toLocaleDateString() + '; ';
            }
          }
          break;
        case DocumentSearchFilters.import:
          if (this.fromImport && this.toImport) {
            this.textFilters += ' '
              + this.getLiteral('document_search_component', 'filtersMessage_DocumentFilter_AmountBetween')
              + ' ' + this.fromImport + ' '
              + this.getLiteral('common', 'and')
              + ' ' + this.toImport + '; ';
          } else {
            if (this.fromImport) {
              this.textFilters += ' ' +
              this.getLiteral('document_search_component', 'filtersMessage_DocumentFilter_MinAmount') + ' '
              + this.fromImport + '; ';
            }
            if (this.toImport) {
              this.textFilters += ' ' +
              this.getLiteral('document_search_component', 'filtersMessage_DocumentFilter_MaxAmount') + ' '
               + this.toImport + '; ';
            }
          }
          break;
        default:
      }

      if (i == this.documentSearchFilters.length - 1) {
        if (this.textFilters.endsWith(', ')) {
          this.textFilters = this.textFilters.substring(0, this.textFilters.length - 2);
        } else if (this.textFilters.endsWith('; ')) {
          this.textFilters = this.textFilters.substring(0, this.textFilters.length - 2);
        }
        this.textFilters += '.';
      }
    }
  }
  private _validateDates(): boolean {
    let maxSpanDays = 1;
    switch (this.searchMode) {
      case SearchDocumentMode.Copy:
        maxSpanDays = this._appDataConfig.maxDaysSpanForCopyDocumentSearch;
        break;
      case SearchDocumentMode.Pending:
        maxSpanDays = this._appDataConfig.maxDaysSpanForCollectPendingDocumentSearch;
        break;
      case SearchDocumentMode.Runaway:
        maxSpanDays = this._appDataConfig.maxDaysSpanForRunawayDocumentSearch;
        break;
      default:
        this.validationTextError = '';
        return false;
    }
    const today = new Date();

    // validamos fecha futura
    if (this.fromEmissionDate != undefined) {
      if (this._differenceDatesInDays(today, this.fromEmissionDate) > 0) {
        this.validationTextError = this.getLiteral('document_search_component', 'validation_DocumentFilter_FromDateCouldNotBeLaterThanToday');
        return false;
      }
    }
    if (this.toEmissionDate != undefined) {
      if (this._differenceDatesInDays(today, this.toEmissionDate) > 0) {
        this.validationTextError = this.getLiteral('document_search_component', 'validation_DocumentFilter_ToDateCouldNotBeLaterThanToday');
        return false;
      }
    }
    if (this.fromEmissionDate == undefined) {
      // from == undefined
      // from = to(if setted else today) - maxSpan
      this.fromEmissionDate = this._setDateMaxSpan(-maxSpanDays, this.toEmissionDate);
    } else {
      if (this.toEmissionDate != undefined) {
        // from != null && to != null
        // check difference
        if (this._differenceDatesInDays(this.fromEmissionDate, this.toEmissionDate) > maxSpanDays ) {
          // the difference is greater than the max span allowed
          this.validationTextError = this.getLiteral('document_search_component', 'validation_DocumentFilter_DaysRangeLessThan') + maxSpanDays;
          return false;
        } else {
            if ( this._differenceDatesInDays(this.fromEmissionDate, this.toEmissionDate) < 0 ) {
              this.validationTextError = this.getLiteral('document_search_component','date_until_date_from');
           return false;
            }
        }
      } else {
        // from != null && to == undefined
        // to = from + maxSpan
        this.toEmissionDate = this._setDateMaxSpan(maxSpanDays, this.fromEmissionDate);

      }
    }
    // establecemos hora de inicio y final para abarcar todo el time
    if (this.fromEmissionDate != undefined) {
      this.fromEmissionDate.setHours(0, 0, 0, 0);
    }
    if (this.toEmissionDate != undefined) {
      this.toEmissionDate.setHours(23, 59, 59, 999);
    }
    return true;
  }
  private _setDateMaxSpan(maxSpan: number, dateOrigen: Date): Date {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const date = dateOrigen == undefined ? new Date() : new Date(dateOrigen);
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() + maxSpan);
    if (date.getTime() >= today.getTime()) {
      // if date is greater or equal than today
      return undefined;
    }
    return date;
  }

  // return the difference in days between 2 dates ignoring the time
  private _differenceDatesInDays(from: Date, to: Date): number {
    const from_0Hour = new Date(from.getTime());
    from_0Hour.setHours(0, 0, 0, 0);
    const to_0Hour = new Date(to.getTime());
    to_0Hour.setHours(0, 0, 0, 0);
    const timeDiff = to_0Hour.getTime() - from_0Hour.getTime();
    return Math.ceil(timeDiff / (1000 * 3600 * 24));
  }

// Valida la diferencia de importe desde a importe hasta
private _validateImports(): boolean {
  if ((this.toImport - this.fromImport) < 0) {
    this.validationTextError = this.getLiteral('document_search_component','amount_until_amount_from');
    return false;
  }
  return true;
}

  getLiteral(group: string, key: string): string {
    return this._languageService.getLiteral(group, key);
  }

}
