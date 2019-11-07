import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
// import { Subject } from 'rxjs/Subject';
import 'rxjs/add/operator/map';

import { DocumentSearch } from 'app/shared/document-search/document-search';
import { HttpService } from 'app/services/http/http.service';
import { AppDataConfiguration } from 'app/config/app-data.config';
import { DocumentSearchRequest } from 'app/shared/document-search/document-search-request';
import { CriteriaRelationshipType } from 'app/shared/document-search/criteria-relationship-type.enum';
import { PaymentPendingFilterType } from 'app/shared/document-search/payment-pending-filter-type.enum';
import { PaymentIdCriteria } from 'app/shared/document-search/criteriaTypes/payment-id-criteria';
import { ScopeType } from 'app/shared/document-search/scope-type.enum';
import { UsageType } from 'app/shared/document-search/usage-type.enum';
import { DocumentNumberCriteria } from 'app/shared/document-search/criteriaTypes/document-number-criteria';
import { TextMatchingType } from 'app/shared/document-search/criteriaTypes/text-matching-type.enum';
import { EmissionDateCriteria } from 'app/shared/document-search/criteriaTypes/emission-date-criteria';
import { DateTimeType } from 'app/shared/document-search/criteriaTypes/date-time-type.enum';
import { TotalAmountWithTaxCriteria } from 'app/shared/document-search/criteriaTypes/total-amount-with-tax-criteria';
import { OperatorIdCriteria } from 'app/shared/document-search/criteriaTypes/operator-id-criteria';
import { PlateCriteria } from 'app/shared/document-search/criteriaTypes/plate-criteria';
import { CriteriaType } from 'app/shared/document-search/criteria-type.enum';
import { SearchDocumentResponse } from 'app/shared/web-api-responses/search-document-response';
import { GetDocumentResponse } from 'app/shared/web-api-responses/get-document-response';
import { FormatHelper } from 'app/helpers/format-helper';
import { SearchDocumentMode } from 'app/shared/document-search/search-document-mode.enum';
import { PaymentMethodType } from 'app/shared/payments/payment-method-type.enum';
import { ExistenceType } from 'app/shared/document-search/criteriaTypes/existence-type.enum';
import { CustomerIdCriteria } from 'app/shared/document-search/criteriaTypes/customer-id-criteria';
import { OrderingFieldType } from 'app/shared/document-search/ordering-field-type.enum';
import { OrderingDirectionType } from 'app/shared/document-search/ordering-direction-type.enum';
import { RoundPipe } from 'app/pipes/round.pipe';
import { ListDocumentResponse } from 'app/shared/web-api-responses/ListDocumentResponse';
import { GetCategoriasRequest } from 'app/shared/document/GetCategoriasRequest';
import { GetCategoriasResponse } from 'app/shared/web-api-responses/GetCategoriasResponse';
import { GetDocumentMassiveResponse } from 'app/shared/web-api-responses/get-document-massive-response';


@Injectable()


export class DocumentSearchInternalService {

  // private _informeDocumentsSend: Subject<ListDocumentResponse> = new Subject();
  private _usageType: UsageType;

  constructor(
    private _httpSvc: HttpService,
    private _appDataConfig: AppDataConfiguration,
    private _roundPipe: RoundPipe
  ) {
  }

  searchDocuments(paramsBusqueda: DocumentSearch): Observable<SearchDocumentResponse> {
    const criteriaList = new Array<any>();
    let usageType: UsageType;
    let paymentPendingFilter: PaymentPendingFilterType = PaymentPendingFilterType.noFilter;
    switch (paramsBusqueda.searchMode) {
      case SearchDocumentMode.Cancel:
        usageType = UsageType.Rectify;
        break;
      case SearchDocumentMode.Copy:
        usageType = UsageType.PrintCopy;
        break;
      case SearchDocumentMode.Runaway:
        const runawayPM = this._appDataConfig.getPaymentMethodByType(PaymentMethodType.runaway);
        const docPaymentCriteria: PaymentIdCriteria = {
          criteriaType: CriteriaType.paymentMethodId,
          idList: [runawayPM.id],
          existenceType: ExistenceType.exists,
        };
        criteriaList.push(docPaymentCriteria);
        usageType = UsageType.PayPending;
        paymentPendingFilter = PaymentPendingFilterType.excludePaymentPendingDocuments; // Fugas
        break;
      case SearchDocumentMode.Pending:
        usageType = UsageType.PayPending;
        paymentPendingFilter = PaymentPendingFilterType.onlyPaymentPendingDocuments;
        break;
      default:
        usageType = UsageType.Other;
    }
    this._usageType = usageType;

    // Establecemos el request para el Web API dinámica según el caso.
    let request: string;

    switch (paramsBusqueda.searchMode) {
      case SearchDocumentMode.Copy:
        // Se usa el mismo modelo que para Deudas.
        request = this.EstablecerRequestDocumentDebtsCOFO(paramsBusqueda);
        break;
      case SearchDocumentMode.Pending:
        request = this.EstablecerRequestDocumentDebtsCOFO(paramsBusqueda);
        break;
      case SearchDocumentMode.Runaway:
        request = this.EstablecerRequestDocumentEscapesCOFO(paramsBusqueda);
        break;
      default:
        request = this.EstablecerRequestDocumentCOFO(paramsBusqueda, criteriaList,
          paymentPendingFilter, usageType);
        break;
    }

    // Ponemos la cadena de conexión con el Web API dinámica según el caso.
    let cadenaApi: string;

    switch (paramsBusqueda.searchMode) {
      case SearchDocumentMode.Copy:
        cadenaApi = 'SearchDocumentPreviousTicketsCOFO';
        break;
      case SearchDocumentMode.Pending:
        cadenaApi = 'SearchDocumentDebtsCOFO';
        break;
      case SearchDocumentMode.Runaway:
        cadenaApi = 'SearchDocumentEscapesCOFO';
        break;
      default:
        cadenaApi = 'SearchDocumentCOFO';
        break;
    }

    return this._httpSvc.postJsonObservable(`${this._appDataConfig.apiUrl}/${cadenaApi}`, request)
      .map(res => {
        const ret: SearchDocumentResponse = {
          status: res.status,
          message: res.message,
          searchMode: this._usageType,
          documentList: res.documentList.map((x: any) => {
            // conversión de fechas a string (si no, JSON las convierte a UTC)
            let emissionLocalDateTime;
            let emissionUTCDateTime;
            if (x.emissionLocalDateTime) {
              emissionLocalDateTime = x.emissionLocalDateTime;
            }
            if (x.emissionUTCDateTime) {
              emissionUTCDateTime = x.emissionUTCDateTime;
            }
            return {
              id: x.id,
              documentNumber: x.documentNumber,
              operatorName: x.operatorName,
              emissionLocalDateTime: new Date(x.emissionLocalDateTime),
              emissionUTCDateTime: new Date(x.emissionUTCDateTime),
              customerTIN: x.customerTIN,
              customerBusinessName: x.customerBusinessName,
              totalAmountWithTax: x.totalAmountWithTax,
              pendingAmountWithTax: x.pendingAmountWithTax
            };
          })
        };
        return ret;
      });
  }


  EstablecerRequestDocumentDebtsCOFO(paramsBusqueda: DocumentSearch): any {
    const request = {
      identity: this._appDataConfig.userConfiguration.Identity,
      tienda: this._appDataConfig.shop.id,
      ndocumento: paramsBusqueda.document,
      ncliente: paramsBusqueda.customerId,
      fechaDesde: paramsBusqueda.fromEmissionDate,
      fechaHasta: paramsBusqueda.toEmissionDate,
      importeDesde: paramsBusqueda.fromImport,
      importeHasta: paramsBusqueda.toImport
    };

    return request;
  }


  EstablecerRequestDocumentEscapesCOFO(paramsBusqueda: DocumentSearch): any {
    const request = {
      identity: this._appDataConfig.userConfiguration.Identity,
      tienda: this._appDataConfig.shop.id,
      ndocumento: paramsBusqueda.document,
      matricula: paramsBusqueda.plate,
      fechaDesde: paramsBusqueda.fromEmissionDate,
      fechaHasta: paramsBusqueda.toEmissionDate,
      importeDesde: paramsBusqueda.fromImport,
      importeHasta: paramsBusqueda.toImport
    };

    return request;
  }


  EstablecerRequestDocumentCOFO(paramsBusqueda: DocumentSearch, criteriaList: any[],
    paymentPendingFilter: PaymentPendingFilterType, usageType: UsageType): any {

    const request = {
      identity: this._appDataConfig.userConfiguration.Identity,
      criteriaList: criteriaList,
      criteriaRelationshipType: CriteriaRelationshipType.and,
      paymentPendingFilterType: paymentPendingFilter,
      scope: ScopeType.shop,
      usageType: usageType,
      orderingField: OrderingFieldType.emissionLocalDateTime,
      orderingDirection: OrderingDirectionType.descending
    };

    if (paramsBusqueda.document != undefined && paramsBusqueda.document.trim() != '') {
      const docNumberCriteria: DocumentNumberCriteria = {
        criteriaType: CriteriaType.documentNumber,
        number: paramsBusqueda.document,
        matchingType: TextMatchingType.Exact
      };
      criteriaList.push(docNumberCriteria);
    }
    if (paramsBusqueda.fromEmissionDate != undefined || paramsBusqueda.toEmissionDate != undefined) {
      const emissionDateCritera: EmissionDateCriteria = {
        criteriaType: CriteriaType.emissionDateTime,
        from: paramsBusqueda.fromEmissionDate,
        to: paramsBusqueda.toEmissionDate,
        type: DateTimeType.local // todo utc/local ???
      };
      criteriaList.push(emissionDateCritera);
    }
    if (paramsBusqueda.fromImport != undefined || paramsBusqueda.toImport != undefined) {
      const amountCriteria: TotalAmountWithTaxCriteria = {
        criteriaType: CriteriaType.totalAmountWithTax,
        from: paramsBusqueda.fromImport,
        to: paramsBusqueda.toImport
      };
      criteriaList.push(amountCriteria);
    }
    if (paramsBusqueda.operator != undefined && paramsBusqueda.operator.trim() != '') {
      const operatorCriteria: OperatorIdCriteria = {
        criteriaType: CriteriaType.operatorId,
        idList: [paramsBusqueda.operator]
      };
      criteriaList.push(operatorCriteria);
    }
    if (paramsBusqueda.plate != undefined && paramsBusqueda.plate.trim() != '') {
      const plateCriteria: PlateCriteria = {
        criteriaType: CriteriaType.paymentDetailPlate,
        plateNumber: paramsBusqueda.plate,
        matchingType: TextMatchingType.Anywhere
      };
      criteriaList.push(plateCriteria);
    }
    if (paramsBusqueda.customerId != undefined && paramsBusqueda.customerId.trim() != '') {
      const customerIdCriteria: CustomerIdCriteria = {
        criteriaType: CriteriaType.customerId,
        idList: [paramsBusqueda.customerId],
      };
      criteriaList.push(customerIdCriteria);
    }
    // TODO bugfix deserializacion case sensitive
    // quitar cuando se arregle en servicio
    for (let i = 0; i < criteriaList.length; i++) {
      const criteria = criteriaList[i];
      criteria.CriteriaType = criteria.criteriaType;
    }
    // Transformacion de fechas
    request.criteriaList.forEach(criteria => {
      if (criteria && criteria.CriteriaType && criteria.criteriaType == CriteriaType.emissionDateTime) {
        if (criteria.from) {
          criteria.from = FormatHelper.dateToISOString(criteria.from);  // formatDateToString
        }
        if (criteria.to) {
          criteria.to = FormatHelper.dateToISOString(criteria.to);
        }
      }

    });

    return request;
  }


  searchDocumentsAnnuled(paramsBusqueda: DocumentSearch): Observable<SearchDocumentResponse> {
    const criteriaList = new Array<any>();
    let usageType: UsageType;
    const paymentPendingFilter: PaymentPendingFilterType = PaymentPendingFilterType.noFilter;
    usageType = UsageType.AnulacionParcial;
    this._usageType = usageType;

    const request: DocumentSearchRequest = {
      identity: this._appDataConfig.userConfiguration.Identity,
      criteriaList: criteriaList,
      criteriaRelationshipType: CriteriaRelationshipType.and,
      paymentPendingFilterType: paymentPendingFilter,
      scope: ScopeType.shop,
      usageType: usageType,
      orderingField: OrderingFieldType.emissionLocalDateTime,
      orderingDirection: OrderingDirectionType.descending

    };
    if (paramsBusqueda.document != undefined && paramsBusqueda.document.trim() != '') {
      const docNumberCriteria: DocumentNumberCriteria = {
        criteriaType: CriteriaType.documentNumber,
        number: paramsBusqueda.document,
        matchingType: TextMatchingType.Exact
      };
      criteriaList.push(docNumberCriteria);
    }
    if (paramsBusqueda.fromEmissionDate != undefined || paramsBusqueda.toEmissionDate != undefined) {
      const emissionDateCritera: EmissionDateCriteria = {
        criteriaType: CriteriaType.emissionDateTime,
        from: paramsBusqueda.fromEmissionDate,
        to: paramsBusqueda.toEmissionDate,
        type: DateTimeType.local // todo utc/local ???
      };
      criteriaList.push(emissionDateCritera);
    }
    if (paramsBusqueda.fromImport != undefined || paramsBusqueda.toImport != undefined) {
      const amountCriteria: TotalAmountWithTaxCriteria = {
        criteriaType: CriteriaType.totalAmountWithTax,
        from: paramsBusqueda.fromImport,
        to: paramsBusqueda.toImport
      };
      criteriaList.push(amountCriteria);
    }
    if (paramsBusqueda.operator != undefined && paramsBusqueda.operator.trim() != '') {
      const operatorCriteria: OperatorIdCriteria = {
        criteriaType: CriteriaType.operatorId,
        idList: [paramsBusqueda.operator]
      };
      criteriaList.push(operatorCriteria);
    }
    if (paramsBusqueda.plate != undefined && paramsBusqueda.plate.trim() != '') {
      const plateCriteria: PlateCriteria = {
        criteriaType: CriteriaType.paymentDetailPlate,
        plateNumber: paramsBusqueda.plate,
        matchingType: TextMatchingType.Anywhere
      };
      criteriaList.push(plateCriteria);
    }
    if (paramsBusqueda.customerId != undefined && paramsBusqueda.customerId.trim() != '') {
      const customerIdCriteria: CustomerIdCriteria = {
        criteriaType: CriteriaType.customerId,
        idList: [paramsBusqueda.customerId],
      };
      criteriaList.push(customerIdCriteria);
    }
    // TODO bugfix deserializacion case sensitive
    // quitar cuando se arregle en servicio
    for (let i = 0; i < criteriaList.length; i++) {
      const criteria = criteriaList[i];
      criteria.CriteriaType = criteria.criteriaType;
    }
    // Transformacion de fechas
    request.criteriaList.forEach(criteria => {
      if (criteria && criteria.CriteriaType && criteria.criteriaType == CriteriaType.emissionDateTime) {
        if (criteria.from) {
          criteria.from = FormatHelper.dateToISOString(criteria.from);  // formatDateToString
        }
        if (criteria.to) {
          criteria.to = FormatHelper.dateToISOString(criteria.to);
        }
      }

      if (criteria && criteria.CriteriaType && criteria.criteriaType == CriteriaType.totalAmountWithTax) {
        if (criteria.from) {
          criteria.from = criteria.from.replace(',', '.');  // formatDateToString
        }
        if (criteria.to) {
          criteria.to = criteria.to.replace(',', '.');
        }
      }


    });
    return this._httpSvc.postJsonObservable(`${this._appDataConfig.apiUrl}/SearchDocumentAnnuledCOFO`, request)
      .map(res => {
        const ret: SearchDocumentResponse = {
          status: res.status,
          message: res.message,
          searchMode: this._usageType,
          documentList: res.documentList.map((x: any) => {
            // conversión de fechas a string (si no, JSON las convierte a UTC)
            let emissionLocalDateTime;
            let emissionUTCDateTime;
            if (x.emissionLocalDateTime) {
              emissionLocalDateTime = x.emissionLocalDateTime;
            }
            if (x.emissionUTCDateTime) {
              emissionUTCDateTime = x.emissionUTCDateTime;
            }
            return {
              id:  x.documentNumber.substring(5),
              documentNumber: x.documentNumber,
              operatorName: x.operatorName,
              emissionLocalDateTime: new Date(x.emissionLocalDateTime),
              totalAmountWithTax: x.totalAmountWithTax,
              pendingAmountWithTax: x.pendingAmountWithTax,
              customerBusinessName: x.customerBusinessName
            };
          })
        };
        return ret;
      });
  }


  searchDocumentsInformeVentas(paramsBusqueda: DocumentSearch): Observable<ListDocumentResponse> {
    const criteriaList = new Array<any>();
    // let responseObj: ListDocumentResponse;
    let usageType: UsageType;
    let paymentPendingFilter: PaymentPendingFilterType = PaymentPendingFilterType.noFilter;
    switch (paramsBusqueda.searchMode) {
      case SearchDocumentMode.Cancel:
        usageType = UsageType.Rectify;
        break;
      case SearchDocumentMode.Copy:
        usageType = UsageType.PrintCopy;
        break;
      case SearchDocumentMode.Runaway:
        const runawayPM = this._appDataConfig.getPaymentMethodByType(PaymentMethodType.runaway);
        const docPaymentCriteria: PaymentIdCriteria = {
          criteriaType: CriteriaType.paymentMethodId,
          idList: [runawayPM.id],
          existenceType: ExistenceType.exists,
        };
        criteriaList.push(docPaymentCriteria);
        usageType = UsageType.PayPending;
        paymentPendingFilter = PaymentPendingFilterType.excludePaymentPendingDocuments; // Fugas
        break;
      case SearchDocumentMode.Pending:
        usageType = UsageType.PayPending;
        paymentPendingFilter = PaymentPendingFilterType.onlyPaymentPendingDocuments;
        break;
      default:
        usageType = UsageType.Other;
    }
    this._usageType = usageType;

    const request: DocumentSearchRequest = {
      identity: this._appDataConfig.userConfiguration.Identity,
      criteriaList: criteriaList,
      criteriaRelationshipType: CriteriaRelationshipType.and,
      paymentPendingFilterType: paymentPendingFilter,
      scope: ScopeType.shop,
      usageType: usageType,
      orderingField: OrderingFieldType.emissionLocalDateTime,
      orderingDirection: OrderingDirectionType.descending

    };
    if (paramsBusqueda.document != undefined && paramsBusqueda.document.trim() != '') {
      const docNumberCriteria: DocumentNumberCriteria = {
        criteriaType: CriteriaType.documentNumber,
        number: paramsBusqueda.document,
        matchingType: TextMatchingType.Exact
      };
      criteriaList.push(docNumberCriteria);
    }
    if (paramsBusqueda.fromEmissionDate != undefined || paramsBusqueda.toEmissionDate != undefined) {
      const emissionDateCritera: EmissionDateCriteria = {
        criteriaType: CriteriaType.emissionDateTime,
        from: paramsBusqueda.fromEmissionDate,
        to: paramsBusqueda.toEmissionDate,
        type: DateTimeType.local // todo utc/local ???
      };
      criteriaList.push(emissionDateCritera);
    }
    if (paramsBusqueda.fromImport != undefined || paramsBusqueda.toImport != undefined) {
      const amountCriteria: TotalAmountWithTaxCriteria = {
        criteriaType: CriteriaType.totalAmountWithTax,
        from: paramsBusqueda.fromImport,
        to: paramsBusqueda.toImport
      };
      criteriaList.push(amountCriteria);
    }
    if (paramsBusqueda.operator != undefined && paramsBusqueda.operator.trim() != '') {
      const operatorCriteria: OperatorIdCriteria = {
        criteriaType: CriteriaType.operatorId,
        idList: [paramsBusqueda.operator]
      };
      criteriaList.push(operatorCriteria);
    }
    if (paramsBusqueda.plate != undefined && paramsBusqueda.plate.trim() != '') {
      const plateCriteria: PlateCriteria = {
        criteriaType: CriteriaType.paymentDetailPlate,
        plateNumber: paramsBusqueda.plate,
        matchingType: TextMatchingType.Anywhere
      };
      criteriaList.push(plateCriteria);
    }
    if (paramsBusqueda.customerId != undefined && paramsBusqueda.customerId.trim() != '') {
      const customerIdCriteria: CustomerIdCriteria = {
        criteriaType: CriteriaType.customerId,
        idList: [paramsBusqueda.customerId],
      };
      criteriaList.push(customerIdCriteria);
    }
    // TODO bugfix deserializacion case sensitive
    // quitar cuando se arregle en servicio
    for (let i = 0; i < criteriaList.length; i++) {
      const criteria = criteriaList[i];
      criteria.CriteriaType = criteria.criteriaType;
    }
    // Transformacion de fechas
    request.criteriaList.forEach(criteria => {
      if (criteria && criteria.CriteriaType && criteria.criteriaType == CriteriaType.emissionDateTime) {
        if (criteria.from) {
          criteria.from = FormatHelper.dateToISOString(criteria.from);  // formatDateToString
        }
        if (criteria.to) {
          criteria.to = FormatHelper.dateToISOString(criteria.to);
        }
      }

    });

     return this._httpSvc.postJsonObservable(`${this._appDataConfig.apiUrl}/SearchDocumentsCriteriaCOFO`, request)
    .map(res => {
        const ret: ListDocumentResponse = {
          status: res.status,
          message: res.message,
          ListDocument: res.listDocument.map((x: any) => {
            // conversión de fechas a string (si no, JSON las convierte a UTC)
            let emissionLocalDateTime;
            let emissionUTCDateTime;
            if (x.emissionLocalDateTime) {
              emissionLocalDateTime = x.emissionLocalDateTime;
            }
            if (x.emissionUTCDateTime) {
              emissionUTCDateTime = x.emissionUTCDateTime;
            }
            return FormatHelper.formatServiceDocument(x, this._roundPipe, SearchDocumentMode.Default);
          })
        };
        return ret;
      });

    // .first()
    //   .subscribe(
    //     (response: ListDocumentResponse) => {
    //       if (response.status == 1) {
    //         responseObj = response;
    //         // this._logHelper.trace(JSON.stringify(response.availableCashboxRecordReasonsOffline));
    //         return response;
    //       }
    //       responseObj = response;
    //       return response;
    //     },
    //     error => {
    //       // this._logHelper.trace(
    //        //  `Se produjo un error al solicitar la ejecución del servicio GetCashRecordTypes: ${error}`);
    //       // this._cashboxRecordReasonsRequested.next(undefined);
    //     });

      // return responseObj;
      // .map(res => {
      //   const ret: ListDocumentResponse = {
      //     Status: res.status,
      //     Message: res.message,
      //     ListDocument: res.ListDocument.map((x: any) => {
      //       // conversión de fechas a string (si no, JSON las convierte a UTC)
      //       let emissionLocalDateTime;
      //       let emissionUTCDateTime;
      //       if (x.emissionLocalDateTime) {
      //         emissionLocalDateTime = x.emissionLocalDateTime;
      //       }
      //       if (x.emissionUTCDateTime) {
      //         emissionUTCDateTime = x.emissionUTCDateTime;
      //       }
      //       return FormatHelper.formatServiceDocument(x, this._roundPipe, SearchDocumentMode.Default);
      //     })
      //   };
      //   return ret;
      // });
  }


  syncCategoriasInformeVentas(): Observable<GetCategoriasResponse> {
    const request: GetCategoriasRequest = {
      identity: this._appDataConfig.userConfiguration.Identity
    };

    let ret: GetCategoriasResponse;

     return this._httpSvc.postJsonObservable(`${this._appDataConfig.apiUrl}/GetCategoriasListCOFO`, request)
    .map(res => {
        ret = {
          CategoriasList: res.categoriasList
        };
        // ret.CategoriasList.unshift({codigo: 'allCategorias', nombre: 'Todas las categorias'});
        return ret;
      });
  }

  getDocument(idDocument: string, searchMode: SearchDocumentMode): Observable<GetDocumentResponse> {
    let usageType: UsageType;
    switch (searchMode) {
      case SearchDocumentMode.Cancel:
        usageType = UsageType.Rectify;
        break;
      case SearchDocumentMode.Copy:
        usageType = UsageType.PrintCopy;
        break;
      case SearchDocumentMode.Runaway:
        usageType = UsageType.PayPending;
        break;
      case SearchDocumentMode.Pending:
        usageType = UsageType.PayPending;
        break;
      default:
        usageType = UsageType.Other;
        break;
    }
    const request = {
      Identity: this._appDataConfig.userConfiguration.Identity,
      Id: idDocument,
      UsageType: usageType
    };
    return this._httpSvc.postJsonObservable(`${this._appDataConfig.apiUrl}/GetDocumentCOFO`, request)
      .map((res: any) => {
        const ret: GetDocumentResponse = {
          status: res.status,
          message: res.message,
          document: FormatHelper.formatServiceDocument(res.document, this._roundPipe, searchMode)
        };
        return ret;
      });
  }

  getDocumentMassive(idDocuments: Array<string>, searchMode: SearchDocumentMode): Observable<GetDocumentMassiveResponse> {
    let usageType: UsageType;
    switch (searchMode) {
      case SearchDocumentMode.Cancel:
        usageType = UsageType.Rectify;
        break;
      case SearchDocumentMode.Copy:
        usageType = UsageType.PrintCopy;
        break;
      case SearchDocumentMode.Runaway:
        usageType = UsageType.PayPending;
        break;
      case SearchDocumentMode.Pending:
        usageType = UsageType.PayPending;
        break;
      default:
        usageType = UsageType.Other;
        break;
    }
    const request = {
      Identity: this._appDataConfig.userConfiguration.Identity,
      IdDocuments: idDocuments,
      UsageType: usageType
    };
    return this._httpSvc.postJsonObservable(`${this._appDataConfig.apiUrl}/GetDocumentMasivoCOFO`, request)
      .map((res: any) => {
        const ret: GetDocumentMassiveResponse = {
          status: res.status,
          message: res.message,
          documents: FormatHelper.formatServiceDocumentMassive(res.documents, this._roundPipe, searchMode)
        };
        return ret;
      });
  }
}
