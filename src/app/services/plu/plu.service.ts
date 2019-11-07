import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';

import { AppDataConfiguration } from 'app/config/app-data.config';
import { HttpService } from 'app/services/http/http.service';
import { FormatHelper } from 'app/helpers/format-helper';
import { SearchPluProductCriteriaFieldType } from 'app/shared/plu/search-plu-product-criteria-field-type.enum';
import { DocumentInternalService } from 'app/services/document/document-internal.service';
import { StatusBarService } from 'app/services/status-bar/status-bar.service';
import { Subscriber } from 'rxjs/Subscriber';
import { ProductForSaleResponse } from 'app/shared/web-api-responses/product-for-sale-response';
import { CustomerInternalService } from 'app/services/customer/customer-internal.service';
import { LogHelper } from 'app/helpers/log-helper';
import { ProductForSaleStatus } from 'app/shared/web-api-responses/product-for-sale-status.enum';
import { DocumentLine } from 'app/shared/document/document-line';
import { ConfirmActionService } from '../confirm-action/confirm-action.service';
import { ConfirmActionType } from '../../shared/confirmAction/confirm-action-type.enum';
import { AuxiliarActionsManagerService } from 'app/services/auxiliar-actions/auxiliar-actions-manager.service';
import { LanguageService } from 'app/services/language/language.service';

@Injectable()
export class PluService {

  constructor(
    private http: HttpService,
    private _appDataConfig: AppDataConfiguration,
    private _docInternalSvc: DocumentInternalService,
    private _statusBarSvc: StatusBarService,
    private _customerInternalSvc: CustomerInternalService,
    private _confirmActionSvc: ConfirmActionService,
    private _auxActionsManager: AuxiliarActionsManagerService,
    private _languageService: LanguageService,
    private _logHelper : LogHelper,
  ) { }

  canSearchWithBarcode: boolean; // Booleano para poder o no buscar con el lector
  // get PLU items
  getPluItems(): Observable<any> {
    return this.http.postJsonObservable(`${this._appDataConfig.apiUrl}/GetPLUItems`,
      { identity: this._appDataConfig.userConfiguration.Identity });
  }

  // get PLU items filtered by a search
  searchProduct(textToSearch: string): Observable<any> {
    const fieldsToSearchIn = [
      SearchPluProductCriteriaFieldType.description,
      SearchPluProductCriteriaFieldType.barCode,
      SearchPluProductCriteriaFieldType.sapCode
    ];
    const request = FormatHelper.formatSearchProductToServiceExpectedObject(textToSearch, fieldsToSearchIn);
    request.identity = this._appDataConfig.userConfiguration.Identity;
    return this.http.postJsonObservable(`${this._appDataConfig.apiUrl}/SearchProduct`, request);
  }
  searchProductBarcode(textToSearch: string): Observable<any> {
    const fieldsToSearchIn = [      
      SearchPluProductCriteriaFieldType.barCode      
    ];
    const request = FormatHelper.formatSearchProductBarCode(textToSearch, fieldsToSearchIn);
    request.identity = this._appDataConfig.userConfiguration.Identity;
    return this.http.postJsonObservable(`${this._appDataConfig.apiUrl}/SearchProductCodeBar`, request);
  }

  // insert product to document
  insertProductToDocument(units: number, id?: string, barcode?: string): Observable<boolean> {
    // id = undefined;
    // barcode = "5449000011527";
    return Observable.create((observer: Subscriber<boolean>) => {
      const request = {
        identity: this._appDataConfig.userConfiguration.Identity,
        barcode,
        customerId: this._getIdCustomer(),
        productId: id,
        quantity: units
      };
      this.http.postJsonObservable(`${this._appDataConfig.apiUrl}/GetProductForSale`, request)
        .first().subscribe((response: ProductForSaleResponse) => {
          if (response.status != ProductForSaleStatus.Successful) {
            this._logError(response.status, response.message);
            observer.next(false);
            return;
          }
          const newLine: DocumentLine = {
            description: response.productName,
            discountPercentage: response.discountPercentage,
            totalAmountWithTax: response.finalAmount,
            productId: response.productReference,
            quantity: response.quantity,
            priceWithTax: response.unitaryPricePreDiscount,
            taxPercentage: response.taxPercentage,
            discountAmountWithTax: response.discountedAmount,
            typeArticle: (response.typeArticle) ? response.typeArticle : 'TIEND',
            originalPriceWithTax: response.unitaryPricePreDiscount,
            isConsigna: response.isConsigna,
            pricelocal: response.pricelocal,
            coste: response.coste,
            modifPvp: response.modifPvp,
            idCategoria: '',
            nameCategoria: ''
          };

          if (newLine.pricelocal !== undefined) {
            newLine.pricelocal = +newLine.pricelocal.toFixed(2);
          }

          if (response.productMessage) { // !isUndefinedOrEmpty
            this._confirmActionSvc.promptActionConfirm(
              response.productMessage,
              this.getLiteral('common', 'aceptar'), undefined, this.getLiteral('common', 'information'),
              ConfirmActionType.Information
            ).first().subscribe(result => {
              if (result) {
                this.publishLine(newLine)
                  .first().subscribe(publishResult => {
                    observer.next(publishResult);
                  });
              } else {
                observer.next(result);
              }
            });
          } else {
            this.publishLine(newLine)
              .first().subscribe(publishResult => {
                observer.next(publishResult);
              });
          }
        },
          failResponse => {
            this._logError(undefined, failResponse);
            observer.next(false);
          });
    });
  }
  private publishLine(newLine: DocumentLine): Observable<boolean> {
    return Observable.create((observer: Subscriber<boolean>) => {
      if (newLine.priceWithTax === 0 || newLine.priceWithTax == undefined) {
        this._auxActionsManager.editDocumentLine(newLine)
          .first().subscribe((lineResult: DocumentLine) => {
            if (lineResult != undefined) {
              this._docInternalSvc.publishLineData(lineResult);
              this._publishMsgStatusBar(this._languageService.getLiteral('plu_service', 'message_PLU_ProductAdded'));
              observer.next(true);
            } else {
              observer.next(false);
            }
          });
      } else {
        this._docInternalSvc.publishLineData(newLine);
        this._publishMsgStatusBar(this._languageService.getLiteral('plu_service', 'message_PLU_ProductAdded'));
        observer.next(true);
      }
    });
  }

  private _getIdCustomer(): string {
    const currentCustomer = this._customerInternalSvc.currentCustomer;
    return currentCustomer == undefined ? undefined : currentCustomer.id;
  }
  private _logError(status: number = -1, text: string) {
    this._logHelper.logError(status, text);
    let msg;
    if (text.includes('El articulo esta bloqueado a la venta')) {
      msg = text.split(':')[1].includes('-') ? text.split(':')[1].split('-')[0] : text;
      this._statusBarSvc.publishMessage(msg);
    } 
  }
  private _publishMsgStatusBar(message: string = this._languageService.getLiteral('plu_service', 'message_PLU_OperationDoneSuccessfully')) {
    this._statusBarSvc.publishMessage(message);
  }
  getLiteral(group: string, key: string): string {
    return this._languageService.getLiteral(group, key);
  }
}
