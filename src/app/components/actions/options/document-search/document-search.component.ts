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
import { GetDocumentResponseStatuses } from 'app/shared/web-api-responses/get-document-response-statuses.enum';
import { SearchDocumentMode } from 'app/shared/document-search/search-document-mode.enum';
import { UsageType } from 'app/shared/document-search/usage-type.enum';
import { DocumentSearchSelected } from 'app/shared/document-search/document-search-selected';
import { LanguageService } from 'app/services/language/language.service';
import { LogHelper } from 'app/helpers/log-helper';

@Component({
  selector: 'tpv-document-search',
  templateUrl: './document-search.component.html',
  styleUrls: ['./document-search.component.scss']
})
export class DocumentSearchComponent implements OnInit {
  @HostBinding('class') class = 'tpv-document-search';
  @Output() documentSelected: EventEmitter<DocumentSearchSelected> = new EventEmitter();
  @Input() documentSearchFilters: Array<DocumentSearchFilters>;
  @Input() fromDate: Date;
  @Input() searchMode: SearchDocumentMode;
  private customer: Customer;

  // esperando para recuperar un documento
  retrievingDocument : boolean;
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
  constructor(
    private _customerInternalService: CustomerInternalService,
    private _documentSearchInternal: DocumentSearchInternalService,
    private _statusBarSvc: StatusBarService,
    private _appDataConfig: AppDataConfiguration,
    private _languageService: LanguageService,
    private  _logHelper: LogHelper
  ) { }

  ngOnInit() {
    this.retrievingDocument = false;
    this._logHelper.trace('Filtros en DocumentSearch:');
    this._logHelper.trace(this.documentSearchFilters);
    this.showDebt = this.documentSearchFilters.find((x) => x == DocumentSearchFilters.debt) != undefined;
    this.filterPanelOpened = false; // TODO ver si esto es asi
    if (this.fromDate != undefined) {
      if (this.searchMode == SearchDocumentMode.Runaway)
      {
        this.fromDate = this.runawayFromDate(this.fromDate);
      }

      this.fromEmissionDate = this.fromDate;
      this.searchDocuments();
      this.textFilters = this.getLiteral('document_search_component', 'literal_DocumentFilter_RecentFilters');
    }
    const baseCurrency = this._appDataConfig.currencyList.find(c => c.priorityType == CurrencyPriorityType.base);
    if (baseCurrency != undefined) {
      this.currencyInfo = baseCurrency;
    } else {
      this._logHelper.trace('PreviewDocumentComponent-> WARNING: No se ha podido recuperar la divisa base');
    }
  }

  //código para revertir la resta de la fecha que se hace en collections.component para el caso de que sea una fuga
  runawayFromDate(fromDate: Date)
  {    
    fromDate.setDate(fromDate.getDate() + 7);

    return fromDate;
  }

  resetSearch() {
    this.documentList = [];
    this._setTextFilters();
  }

  selectDocument(index: number) {
    this.retrievingDocument = true;
    this.selectedDocumentIndex = index;
    if (this.documentList[index] == undefined) {
      this._logHelper.trace('Error recuperando ticket,index invalido');
      return;
    }
    this._documentSearchInternal.getDocument(this.documentList[index].id, this.searchMode)
      .first()
      .subscribe(response => {
        if (response == undefined || response.status != GetDocumentResponseStatuses.Successful) {
          this.searchMessage = this.getLiteral('document_search_component', 'error_DocumentFilter_ErrorGettingDocument');
          this._logHelper.trace(response.message);
          if (FormatHelper.formatGetDocumentResponseStatusesMessage(response.status) !== 'Se ha producido un error.') {
            this._statusBarSvc.publishMessage(FormatHelper.formatGetDocumentResponseStatusesMessage(response.status));
          }
          return;
        }
        response.document.isCobro = true;
        // response.document.pendingAmountWithTax = response.document.pendingAmountWithTax != undefined ?
        // response.document.pendingAmountWithTax : this.documentList[index].pendingAmountWithTax;

        this.documentSelected.emit({
          documentSelected: response.document,
          usageType: FormatHelper.SearchDocumentModeToUsageType(this.searchMode)
        });
        this.retrievingDocument = false;
      });
  }

  searchDocuments(): void {
    // input validation, at least should have 1 filter active
    if (
      (this.document == undefined || this.document.trim() == '')
      && (this.fromEmissionDate == undefined || this.fromEmissionDate.toString() == '')
      && (this.toEmissionDate == undefined || this.toEmissionDate.toString() == '')
      && (this.plate == undefined || this.plate.trim() == '')
      && (this.fromImport == undefined)
      && (this.toImport == undefined)
      && (this.customerBusinessName == undefined || this.customerBusinessName == '')
    ) {
      this.validationTextError = this.getLiteral('document_search_component', 'validation_DocumentFilter_OneFieldRequired');
      this.showValidationError = true;
      return;
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
        },
        error => {
          this._logHelper.trace(error);
          this.isSearching = false;
          this.documentList = [];
          this.searchMessage = this.getLiteral('document_search_component', 'error_DocumentFilter_DocumentSearchingError');
          this.selectedDocumentIndex = -1;
        });
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
              + this.toEmissionDate.toLocaleDateString()+ '; ';
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
        if (this._differenceDatesInDays(this.fromEmissionDate, this.toEmissionDate) > maxSpanDays) {
          // the difference is greater than the max span allowed
          this.validationTextError = this.getLiteral('document_search_component', 'validation_DocumentFilter_DaysRangeLessThan') + maxSpanDays;
          return false;
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
