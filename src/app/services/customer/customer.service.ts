import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { AppDataConfiguration } from 'app/config/app-data.config';
import { HttpService } from 'app/services/http/http.service';
import { FormatHelper } from 'app/helpers/format-helper';
import { Customer } from 'app/shared/customer/customer';
import { SearchCustomerCriteriaFieldType } from 'app/shared/customer/search-customer-criteria-field-type.enum';
import { Subscriber } from 'rxjs/Subscriber';
import { LogHelper } from '../../helpers/log-helper';
import { GetFleetCustomerResponse } from 'app/shared/hubble-pos-web-api-responses/get-fleet-customer/get-fleet-customer-response';
import { DocumentLine } from 'app/shared/document/document-line';
import { ProductForSaleResponse } from 'app/shared/web-api-responses/product-for-sale-response';
import { ProductForSaleStatus } from 'app/shared/web-api-responses/product-for-sale-status.enum';
import { Subject } from 'rxjs/Subject';
import { RoundPipe } from 'app/pipes/round.pipe';

@Injectable()
export class CustomerService {
    // Enviar la referencia del value del input
    private _sendIsActiveDefaultCustomer: Subject<boolean> = new Subject();
    sendIsActiveDefaultCustomer$ = this._sendIsActiveDefaultCustomer.asObservable();

  constructor(
    private _http: HttpService,
    private _appDataConfig: AppDataConfiguration,
    private _roundPipe: RoundPipe,
    private _logHelper : LogHelper,
  ) {
  }

  // buscar clientes existentes
  searchCustomer(textToSearch: string): Observable<any> {
    const fieldsToSearchIn = [
      SearchCustomerCriteriaFieldType.businessName,
      SearchCustomerCriteriaFieldType.tin,
      SearchCustomerCriteriaFieldType.matricula
    ];
    const request = FormatHelper.formatSearchCustomerToServiceExpectedObject(textToSearch, fieldsToSearchIn);
    request.identity = this._appDataConfig.userConfiguration.Identity;
    return this._http.postJsonObservable(`${this._appDataConfig.apiUrlCofo}/SearchCustomer_COFO`, request);
  }

  // get Customer by id
  getCustomerById(id: string, matricula?: string): Observable<Customer> {
    return Observable.create((subscriber: Subscriber<Customer>) => {
      const request = { id: id, identity: this._appDataConfig.userConfiguration.Identity };
      this._http.postJsonObservable(`${this._appDataConfig.apiUrl}/GetCustomer`, request)
        .first().subscribe(getCustomerResponse => {
          if (getCustomerResponse == undefined) {
            subscriber.next(undefined);
            return;
          }
          if (getCustomerResponse.status != 1) {
            this._logHelper.logError(getCustomerResponse.status, getCustomerResponse.message);
            subscriber.next(undefined);
            return;
          }
          subscriber.next(FormatHelper.formatCustomerFromService(getCustomerResponse.customer, false, this._appDataConfig.currencyList, matricula));
        }, error => {
          subscriber.error(error);
        });
    });

  }

  // get Default Customer with vehicle registration by id
  getDefaultCustomerById(id: string): Observable<Customer> {
    return Observable.create((subscriber: Subscriber<Customer>) => {
      const request = { id: id, identity: this._appDataConfig.userConfiguration.Identity };
      this._http.postJsonObservable(`${this._appDataConfig.apiUrl}/GetDefaultCustomer_COFO`, request)
        .first().subscribe(getCustomerResponse => {
          if (getCustomerResponse == undefined) {
            subscriber.next(undefined);
            return;
          }
          if (getCustomerResponse.status != 1) {
            this._logHelper.logError(getCustomerResponse.status, getCustomerResponse.message);
            subscriber.next(undefined);
            return;
          }
          subscriber.next(FormatHelper
            .formatCustomerFromService(getCustomerResponse.customer, false, this._appDataConfig.currencyList, getCustomerResponse.matricula));
        }, error => {
          subscriber.error(error);
        });
    });

  }

  showIsDefaultCustomer(isDefaultCustomer: boolean) {
    this._sendIsActiveDefaultCustomer.next(isDefaultCustomer);
  }

  // set Customer
  createCustomer(customer: Customer): Observable<any> {
    const insertCustomerDAO = FormatHelper.formatCustomerToServiceExpectedObject(customer);
    const request = { identity: this._appDataConfig.userConfiguration.Identity, createDAO: insertCustomerDAO };
    return this._http.postJsonObservable(`${this._appDataConfig.apiUrl}/CreateCustomer`, request);
  }

  // pedir paises disponibles
  getCountries(): Observable<any> {
    const request = { identity: this._appDataConfig.userConfiguration.Identity };
    return this._http.postJsonObservable(`${this._appDataConfig.apiUrl}/GetCountries`, request);
  }

  // pedir ciudades según pais
  searchCityByCountry(countryName: string): Observable<any> {
    const request = FormatHelper.formatSearchCityByCountryToServiceExpectedObject(countryName);
    request.identity = this._appDataConfig.userConfiguration.Identity;
    return this._http.postJsonObservable(`${this._appDataConfig.apiUrl}/SearchCity`, request);
  }

  // pedir ciudades según nombre
  searchCityByName(cityName: string): Observable<any> {
    const request = FormatHelper.formatSearchCityByNameToServiceExpectedObject(cityName);
    request.identity = this._appDataConfig.userConfiguration.Identity;
    return this._http.postJsonObservable(`${this._appDataConfig.apiUrl}/SearchCity`, request);
  }

  // pedir cp y Provincia según ciudad
  searchProvinceByCountry(countryName: string): Observable<any> {
    const request = FormatHelper.formatSearchProvinceByCountryToServiceExpectedObject(countryName);
    request.identity = this._appDataConfig.userConfiguration.Identity;
    return this._http.postJsonObservable(`${this._appDataConfig.apiUrl}/SearchProvince`, request);
  }

  // pedir lista de tipos de tin (dni, nif...)
  getTinTypeList(): Observable<any> {
    const request = { identity: this._appDataConfig.userConfiguration.Identity };
    return this._http.postJsonObservable(`${this._appDataConfig.apiUrl}/GetLegalForms`, request);
  }

  // pedir customer by flotas id
  getFleetCustomer(arg: string): Observable<GetFleetCustomerResponse> {
    const argT = this._appDataConfig.virtualTerminalSerialNumber;
      const request = {
        identity: this._appDataConfig.userConfiguration.Identity,
        argMac: '',
        argCard1: '',
        argCard2: arg,
        argTerminal: argT
      };
    return this._http.postJsonObservable(`${this._appDataConfig.apiUrl}/GetCustomerByCardId`, request);
  }

  /**
   *
   * @description determina si las lineas cambian al cambiar de Customer
* @param {Array<DocumentLine>} currentLines
* @param {Customer} newCustomer
* @returns {boolean}
* @memberof CustomerService
*/
isTheSameRate(currentLines: Array<DocumentLine>, newCustomer: Customer): Observable<boolean> {
  return Observable.create((observer: Subscriber<boolean>) => {
    const arrObsv: Array<Observable<DocumentLine>>  = new Array<Observable<DocumentLine>>();
    currentLines.forEach(element => {
      arrObsv.push(this._getProductForSale(element.productId, element.quantity, newCustomer));
    });

    if (arrObsv.length > 0) {
      Observable.zip(...arrObsv)
        .first().subscribe((linesForNewCustomer: Array<DocumentLine>) => {
          for (let index = 0; index < currentLines.length; index++) {
            const element = currentLines[index];
            if (element == undefined) {
              observer.next(false);
              return;
            }
            if (element.quantity != linesForNewCustomer[index].quantity
                || element.priceWithTax != linesForNewCustomer[index].priceWithTax
                || element.discountPercentage != linesForNewCustomer[index].discountPercentage) {
              observer.next(false);
              return;
            }
          }
          observer.next(true);
          return;
        });
    } else {
      observer.next(true);
      return;
    }
  });
  }

  _getProductForSale(id: string, units: number, newCustomer: Customer): Observable<DocumentLine> {
    return Observable.create((observer: Subscriber<DocumentLine>) => {
    const request = {
      identity: this._appDataConfig.userConfiguration.Identity,
      id: id,
      customerId: newCustomer.id,
      productId: id,
      quantity: units
    };
    this._http.postJsonObservable(`${this._appDataConfig.apiUrl}/GetProductForSale`, request)
    .first().subscribe((response: ProductForSaleResponse) => {
      if (response.status != ProductForSaleStatus.Successful) {
        this._logHelper.logError('No se ha podido obtener el producto');
        observer.error('');
        return;
      }
      const newLine: DocumentLine = {
        description: response.productName,
        discountPercentage: this._roundPipe.transformInBaseCurrency(response.discountPercentage),
        totalAmountWithTax: response.finalAmount,
        productId: response.productReference,
        quantity: this._roundPipe.transformInBaseCurrency(response.quantity),
        priceWithTax: this._roundPipe.transformInBaseCurrency(response.unitaryPricePreDiscount),
        taxPercentage: response.taxPercentage,
        discountAmountWithTax: this._roundPipe.transformInBaseCurrency(response.discountedAmount),
        originalPriceWithTax: this._roundPipe.transformInBaseCurrency(response.originalPriceWithTax),
        idCategoria: '',
        nameCategoria: '',
        typeArticle: response.typeArticle
      };
      observer.next(newLine);
    });
  });
  }
}
