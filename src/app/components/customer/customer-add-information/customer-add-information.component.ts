import { Component, OnInit, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { IActionFinalizable } from '../../../shared/iaction-finalizable';
import { Observable } from 'rxjs/Observable';
import { Customer } from 'app/shared/customer/customer';
import { CustomerAddInformationResult } from '../../../shared/customer-add-information/customer-add-information-result';
import { Subject } from 'rxjs/Subject';
import { CustomerAddInformationRequest } from 'app/shared/customer-add-information/customer-add-information-request';
import { AppDataConfiguration } from '../../../config/app-data.config';
import { LanguageService } from 'app/services/language/language.service';

@Component({
  selector: 'tpv-customer-add-information',
  templateUrl: './customer-add-information.component.html',
  styleUrls: ['./customer-add-information.component.scss']
})
export class CustomerAddInformationComponent implements OnInit, AfterViewInit, IActionFinalizable<CustomerAddInformationResult> {
  @ViewChild('customer') customer: ElementRef;

  private _customer: Customer;
  txtPlate: string;
  private _subjectResponse = new Subject<CustomerAddInformationResult>();
  mustRequestCustomerPlate: boolean;
  editPlate: boolean;


  constructor(
    private appDataSvc: AppDataConfiguration,
    private _languageService: LanguageService
  ) {
    this.mustRequestCustomerPlate = appDataSvc.mustRequestCustomerPlate;
  }

  ngOnInit() {
  }
  set addInformationRequest(requestData: CustomerAddInformationRequest) {
    this._customer = requestData.customer;
    this.txtPlate = requestData.customer.cardInformation == undefined ? '' : requestData.customer.cardInformation.plate;
    this.editPlate = requestData.editPlate;
  }

  ngAfterViewInit() {
    // NOTA: hack timeout para ejecutar funciones estando ya renderizado el HTML
    setTimeout(() => {
      if (this.customer) {       
        /*(this.customer.nativeElement as HTMLElement).click();
        (this.customer.nativeElement as HTMLElement).focus();*/
        if (this._customer.id === this.appDataSvc.defaultCustomer  || this._customer.id === this.appDataSvc.unknownCustomerId) {
          this.btnChangeCustomerClick();
        }
      }
    }, 0);
  }
  /**********view accessors/funcions************ */
  /**
   * usada en la vista para obtener cif/nif
   */
  customerTin(): string {
    return this._customer == undefined || this.isUndefinedOrEmpy(this._customer.tin) ?
      '-' : this._customer.tin;
  }
  /**
   * usada en a vista para obtener name
   */
  customerName(): string {
    return this._customer == undefined || this.isUndefinedOrEmpy(this._customer.businessName) ?
      '-' : this._customer.businessName;
  }
  /**
   * usada en la vista para obtener direccion
   */
  customerAdress(): string {
    return this._customer == undefined || this._customer.addressList == undefined
      || this._customer.addressList[0] == undefined || this.isUndefinedOrEmpy(this._customer.addressList[0].street) ?
      '-' : this._customer.addressList[0].street;
  }

  driverPlate(): string {
    return this._customer == undefined || this._customer.cardInformation == undefined
      || this.isUndefinedOrEmpy(this._customer.cardInformation.plate) ?
      '-' : this._customer.cardInformation.plate;
  }

  driverName(): string {
    return this._customer == undefined || this._customer.cardInformation == undefined
      || this.isUndefinedOrEmpy(this._customer.cardInformation.driverName) ?
      '-' : this._customer.cardInformation.driverName;
  }

  driverBalance(): string {
    let saldo: string;
    /* saldo = this._customer == undefined || this._customer.cardInformation == undefined
      || this._customer.cardInformation.balance == undefined
      || isNaN(this._customer.cardInformation.balance) ? undefined : this._customer.cardInformation.balance.toString();

    if (saldo == undefined) {
      saldo = '-';
    } else {
      if (this._customer.cardInformation.balanceCurrencyId == this.appDataSvc.baseCurrency.id) {
        saldo += this.appDataSvc.baseCurrency.symbol;
      } else if (this.appDataSvc.secondaryCurrency != undefined &&
        this.appDataSvc.secondaryCurrency.id == this._customer.cardInformation.balanceCurrencyId) {
        saldo += ' ' + this.appDataSvc.secondaryCurrency.symbol;
      } else {
        // la moneda no es ni primaria ni secundaria
        saldo = '-';
      }
    } */
    // SALDO DE CREDITO DEL CLIENTE
    saldo = this._customer == undefined ? '0' : (this._customer.riesgo1 - this._customer.riesgo2).toFixed(2).toString() + ' €';
    return saldo;
  }

  /**********view actions*** */
  btnAceptClick() {
    this._subjectResponse.next({
      success: true,
      plate: this.txtPlate
    });
  }
  btnChangeCustomerClick() {
    this._subjectResponse.next({
      success: true,
      changeCustomerRequested: true
    });
  }
  /*****************
  * IACTIONFINALIZABLE
  *********************/
  onFinish(): Observable<CustomerAddInformationResult> {
    return this._subjectResponse.asObservable();
  }
  forceFinish(): void {
    this._subjectResponse.next({
      success: false
    });
  }
  /***********
   * PRIVADAS
   * ********* */
  private isUndefinedOrEmpy(txtStr: string) {
    return txtStr == undefined || txtStr.trim() == '';
  }
  getLiteral(group: string, key: string): string {
    return this._languageService.getLiteral(group, key);
  }
}
