import {
  Component,
  OnInit,
  OnDestroy,
  AfterViewInit,
  HostBinding,
  EventEmitter,
  Output,
  Input,
  ViewChild,
  ElementRef,
  HostListener
} from '@angular/core';
import { CustomerService } from 'app/services/customer/customer.service';
import { Customer } from 'app/shared/customer/customer';
import { CustomerInternalService } from 'app/services/customer/customer-internal.service';
import { CustomerAddInformationRequest } from 'app/shared/customer-add-information/customer-add-information-request';
import { CustomerAddInformationResult } from 'app/shared/customer-add-information/customer-add-information-result';
import { CustomerSelectedResult } from 'app/shared/customer/customer-selected-result';
import { FormatHelper } from 'app/helpers/format-helper';
import { ConfirmActionService } from 'app/services/confirm-action/confirm-action.service';
import { ConfirmActionType } from 'app/shared/confirmAction/confirm-action-type.enum';
import { AppDataConfiguration } from 'app/config/app-data.config';
import { GetFleetCustomerResponse } from '../../../shared/hubble-pos-web-api-responses/get-fleet-customer/get-fleet-customer-response';
import {
  GetFleetCustomerResponseStatuses
} from 'app/shared/hubble-pos-web-api-responses/get-fleet-customer/get-fleet-customer-response-statuses.enum';
import { LanguageService } from 'app/services/language/language.service';
import { LogHelper } from 'app/helpers/log-helper';

@Component({
  selector: 'tpv-customers-fleet-identification',
  templateUrl: './customers-fleet-identification.component.html',
  styleUrls: ['./customers-fleet-identification.component.scss']
})
export class CustomerFleetIdentificationComponent implements OnInit, AfterViewInit, OnDestroy {

  @HostBinding('class') class = 'tpv-customers-fleet-identification';
  // para pasar el customer al componente padre
  @Output() customerSelected = new EventEmitter<CustomerSelectedResult>();
  // para poner el foco en el input
  @ViewChild('customerSearch') customerSearch: ElementRef;

  // datos de busqueda
  dataSearch: string;

  // customers de la búsqueda
  customers: Array<Customer> = [];
  // mensaje cuando no encuentre resultados
  searchMessage: string;

  private balanceErrorHeaderLiteral = this.getLiteral('customer_search_component','header_SearchCustomer_RateDoesNotMatch');
  private balanceErrorTextLiteral = this.getLiteral('customer_fleet_component','tarjeta_configurada');
  private balanceErrorAceptLiteral = this.getLiteral('customer_add_information_component','button_CustomerAddInformation_OK');

  // variables necesarias para el reconocimiento de la tarjeta
  private readonly _startChar: string = 'ñ';
  private readonly _endChar: string = 'Enter';
  private _swipeBuffer: string = '';
  private _listeningSwipe: boolean = false;
  private _swipeTimeOut: any = undefined;
  private SWIPE_TIMEOUT_MS: number = 100;

  constructor(
    private customerService: CustomerService,
    private customerInternal: CustomerInternalService,
    private _confirmActionService: ConfirmActionService,
    private _appDataConfig: AppDataConfiguration,
    private _languageService: LanguageService,
    private _logHelper: LogHelper
  ) {
    this.customers = [];
  }

  ngOnInit() {
    this.dataSearch = '';
  }

  ngOnDestroy() {
  }

  ngAfterViewInit(): void {
  }

  @Input() set setFocusToCustomerSearch(setFocusToCustomer: boolean) {
    if (setFocusToCustomer === true) {
      this.setInputFocus();
    }
  }

  @HostListener('window:keyup', ['$event'])
  keyEvent(event: KeyboardEvent) {

    if (this._startChar == event.key && !this._listeningSwipe) {
      this._swipeBuffer += event.key;
      this._listeningSwipe = true;
    } else if (this._listeningSwipe) {
      if (this._endChar == event.key) {
        this._swipeBuffer = this._swipeBuffer.replace('ñ', '');
        this._swipeBuffer = this._swipeBuffer.replace('Shift-', '');
        // abro el componente de CustomerAddInformationComponent
        this.searchFleetCustomer(this._swipeBuffer);
        this._swipeBuffer = '';
        this._listeningSwipe = false;
      } else {
        this._swipeBuffer += event.key;
        this.dataSearch = '';
      }

      // si se pasa de tiempo se descarta que sea un lector
      if (this._swipeTimeOut == undefined) {
        this._swipeTimeOut = setTimeout(this._clearSwipeBuffer.bind(this), this.SWIPE_TIMEOUT_MS);
      } else {
        clearTimeout(this._swipeTimeOut);
        this._swipeTimeOut = setTimeout(this._clearSwipeBuffer.bind(this), this.SWIPE_TIMEOUT_MS);
      }
    }
  }

  private _clearSwipeBuffer() {
    if (this._swipeBuffer != '') {
      this.dataSearch = this._swipeBuffer;
    }
    this._swipeBuffer = '';
    this._listeningSwipe = false;
  }

  setInputFocus() {
    if (this.customerSearch) {
      (this.customerSearch.nativeElement as HTMLElement).click();
      (this.customerSearch.nativeElement as HTMLElement).focus();
    }
  }

  /**
   *
   * @description detecta la busqueda del usuario
   * @returns {void}
   * @memberof CustomerFleetIdentificationComponent
   */
  selectCustomer(): void {
    const data: string = this.dataSearch + '';

    if (data == '' || data == undefined) {
      return this.limpiarDatos();
    }
    this.searchFleetCustomer(data);
  }

  /**
   *
   *
   * @memberof CustomerFleetIdentificationComponent
   */
  limpiarDatos() {
    this.dataSearch = '';
    this.searchMessage = '';
    this.customers = [];
  }

  /**
   *
   * @description Busca el customer de flotas, llamando al web api,
   * luego despues de recuperar al customer, comprueba que el currencyId sea el
   * currency base o secuntary sino se le informa al usuario que dicha tarjeta esta mal configurada
   * @memberof CustomerFleetIdentificationComponent
   */
  searchFleetCustomer(data: string) {
    this.customerService.getFleetCustomer(data)
    .first()
    .subscribe (
      (response: GetFleetCustomerResponse) => {
        if (response.status == GetFleetCustomerResponseStatuses.successful) {
          response.cardCustomer.isFleet = true;
          const cardCustomer: Customer = FormatHelper.formatCustomerFromService(response.cardCustomer, true, this._appDataConfig.currencyList);
          cardCustomer.cardInformation.isFleet = true;
          // si no es baseCurrency y si el secondaryCurrency es undefined o el secondaryCurrency es igual
          // al currency que ha devuelto el webService
          if (this._appDataConfig.baseCurrency.id != cardCustomer.cardInformation.balanceCurrencyId) {
            if (this._appDataConfig.secondaryCurrency == undefined
              || this._appDataConfig.secondaryCurrency.id == cardCustomer.cardInformation.balanceCurrencyId) {
                this._confirmActionService
                  .promptActionConfirm(
                    this.balanceErrorTextLiteral,
                    this.balanceErrorAceptLiteral,
                    undefined,
                    this.balanceErrorHeaderLiteral,
                    ConfirmActionType.Error)
                  .first().subscribe(_ => {
                  });
              }
            } else {
              // añado el cliente al request
              const request: CustomerAddInformationRequest = {
                customer: cardCustomer,
                editPlate: cardCustomer == undefined || cardCustomer.cardInformation == undefined
                  || cardCustomer.cardInformation.plate == undefined || cardCustomer.cardInformation.plate.trim() == ''
              };
              // propago el request
              this.customerInternal.requestAddCustomerInformation(request).first().subscribe(
                (res: CustomerAddInformationResult) => {
                  // respuesta de addCustomerInformation
                  if (!res.changeCustomerRequested) {
                    if (request.editPlate) {
                      request.customer.cardInformation.plate = res.plate;
                    }
                    this.customerSelected.emit({
                      customer: request.customer,
                      isFromCreateForm: false,
                      plate: res.plate
                    });
                  }
                });
            }
          } else {
            this.customers = [];
            this._logHelper.logError(response.errorMessage);
            this.searchMessage = this.getLiteral('customer_search_component','error_SearchCustomer_NoResults');
          }
        },
        (error) => {
          this.searchMessage = this.getLiteral('customer_search_component','error_SearchCustomer_SearchingError');
        });
  }
  getLiteral(group: string, key: string): string {
    return this._languageService.getLiteral(group, key);
  }
}
