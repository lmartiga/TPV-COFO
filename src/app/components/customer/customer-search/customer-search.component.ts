import {
  Component,
  OnInit,
  OnDestroy,
  AfterViewInit,
  HostBinding,
  EventEmitter,
  Output,
  ViewChild,
  ElementRef,
  HostListener
} from '@angular/core';
import { CustomerService } from 'app/services/customer/customer.service';
import { Customer } from 'app/shared/customer/customer';
import { AppDataConfiguration } from 'app/config/app-data.config';
import { CustomerSelectedResult } from '../../../shared/customer/customer-selected-result';
import { Subscription } from '../../../../../node_modules/rxjs/Subscription';
import { DocumentInternalService } from 'app/services/document/document-internal.service';
import { ConfirmActionService } from 'app/services/confirm-action/confirm-action.service';
import { ConfirmActionType } from 'app/shared/confirmAction/confirm-action-type.enum';
import { LanguageService } from 'app/services/language/language.service';

@Component({
  selector: 'tpv-customer-search',
  templateUrl: './customer-search.component.html',
  styleUrls: ['./customer-search.component.scss']
})

export class CustomerSearchComponent implements OnInit, AfterViewInit, OnDestroy {

  @HostBinding('class') class = 'tpv-customer-search';
  // para pasar el customer al componente padre
  @Output() customerSelected = new EventEmitter<CustomerSelectedResult>();
  // para poner el foco en el input
  @ViewChild('customerSearch') customerSearch: ElementRef;

  // datos de busqueda
  dataSearch: string;

  // suscripcion de busqueda de cliente
  private customerSearchSubscription: Subscription;
  // customers de la búsqueda
  customers: Array<Customer> = [];
  // mensaje cuando no encuentre resultados
  searchMessage: string;
  isDefaultCustomer: boolean;
  bit: boolean = false;
  isCreationCustomer: boolean;
  // variables necesarias para el reconocimiento de la tarjeta
  private readonly _startChar: string = 'ñ';
  private readonly _endChar: string = 'Enter';
  private _swipeBuffer: string = '';
  private _listeningSwipe: boolean = false;
  private _swipeTimeOut: NodeJS.Timer = undefined;
  private readonly SWIPE_TIMEOUT_MS: number = 500;

  private balanceErrorHeaderLiteral = this.getLiteral('customer_search_component','header_SearchCustomer_RateDoesNotMatch');
  // tslint:disable-next-line:max-line-length
  private balanceErrorTextLiteral = this.getLiteral('customer_search_component','error_SearchCustomer_RateDoesNotMatch');
  private balanceErrorAceptLiteral = this.getLiteral('customer_search_component','buttom_SearchCustomer_RateDoesNotMatch');

  constructor(
    private _appDataConfig: AppDataConfiguration,
    private customerService: CustomerService,
    private _confirmActionService: ConfirmActionService,
    private _internalDocumentService: DocumentInternalService,
    private _languageService: LanguageService) {
    this.customers = [];
  }

  ngOnInit() {
    this.isCreationCustomer = false;
    this.isDefaultCustomer = true;
    this.dataSearch = '';
    const valores = this._appDataConfig.getConfigurationParameterByName('BIT_ACTIVE_VALIDATE_CLIENT', 'GENERAL');
    this.bit = valores == undefined ? false : (valores.meaningfulStringValue == 'false' ? false : true);
    this.customerService.sendIsActiveDefaultCustomer$
    .subscribe( value => {
      this.isDefaultCustomer = value;
    });
  }

  ngOnDestroy() {
  }

  ngAfterViewInit(): void {
    // NOTA: hack timeout para ejecutar funciones estando ya renderizado el HTML
    setTimeout(() => {
      // NOTA: de momento el foco de este componente es controlado por su padre CUSTOMER
      // this.setInputFocus();
    }, 0);
  }
  @HostListener('window:keyup', ['$event'])
  keyEvent(event: KeyboardEvent) {

    if (this._startChar == event.key && !this._listeningSwipe) {
      this._swipeBuffer += event.key;
      this._listeningSwipe = true;
    } else if (this._listeningSwipe) {
      // cuando recibo la cadena esperada
      if (this._endChar == event.key) {
        // abro el componente de CustomerAddInformationComponent
        this._swipeBuffer = '';
        this._listeningSwipe = false;
      } else {
        // se añade el key al buffer
        this._swipeBuffer += event.key;
        // se limpia el input
        this.dataSearch = '';
      }

      // si se pasa de tiempo se descarta que sea un lector
      if (this._swipeTimeOut == undefined) {
        this._swipeTimeOut = setTimeout(() => this._clearSwipeBuffer(), this.SWIPE_TIMEOUT_MS);
      } else {
        clearTimeout(this._swipeTimeOut);
        this._swipeTimeOut = setTimeout(() => this._clearSwipeBuffer(), this.SWIPE_TIMEOUT_MS);
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
      // (this.customerSearch.nativeElement as HTMLElement).click();
      (this.customerSearch.nativeElement as HTMLElement).focus();
      setTimeout(() => (this.customerSearch.nativeElement as HTMLElement).click(), this.SWIPE_TIMEOUT_MS);
    }
  }

  /**
   *
   * @description Controla la introdución de datos en el input,
   * si el dato se ha introducido muy rápido el sistema buscara dicho dato
   * solo pasado SWIPE_TIMEOUT_MS
   * @memberof CustomerSearchComponent
   */
  onSearchChange(): void {
    // si se pasa de tiempo se busca el cliente
    if (this._swipeTimeOut == undefined) {
      this._swipeTimeOut = setTimeout(() => this._searchCustomer(), this.SWIPE_TIMEOUT_MS);
    } else {
      clearTimeout(this._swipeTimeOut);
      this._swipeTimeOut = setTimeout(() => this._searchCustomer(), this.SWIPE_TIMEOUT_MS);
    }
  }
  /**
   * @description busca un cliente llamando al WebAPI
   * @private
   * @returns
   * @memberof CustomerSearchComponent
   */
  private _searchCustomer() {
    // cancelamos posibles consultas previas.
    if (this.customerSearchSubscription != undefined && !this.customerSearchSubscription.closed) {
      this.customerSearchSubscription.unsubscribe();
    }
    const data: string = this.dataSearch + '';
    if (data == '' || data == undefined) {
      return this.limpiarDatos();
    }

    if (data.length >= 3) {
      this.customerSearchSubscription = this.customerService.searchCustomer(data)
        .first()
        .subscribe(
          (response) => {
            if (response.customerList && response.customerList.length != 0) {
              this.customers = response.customerList as Array<Customer>;
            } else {
              this.customers = [];
              this.searchMessage = this.getLiteral('customer_search_component','error_SearchCustomer_NoResults');
            }
          },
          (error) => {
            this.searchMessage = this.getLiteral('customer_search_component','error_SearchCustomer_ErrorFound');
          });
    }
  }

  // cuando pulsa enter, si no hay valor, se busca cliente contado
  selectCustomer() {
    if (this.isCreationCustomer) {
      return;
    }
    if (this._swipeBuffer == '') {
      const data: string = this.dataSearch;
      // si se ha buscado un cliente y solo hay un resultado se inserta
      if (data != '' && this.customers && this.customers.length == 1) {
        this.selectCustomerById(this.customers[0].id, this.customers[0].matricula);
      }
      // en otro caso (sin haber buscado cliente) se selecciona al cliente contado
      if (data == '' || data == undefined) {
        if (this.isDefaultCustomer) {
          this.selectCustomerById(this._appDataConfig.defaultCustomer, '');
        }
      }
    }
  }

  // cuando selecciona cliente de la lista de resultados, se envía como cliente seleccionado
  selectCustomerById(id: string, matricula: string) {
    this.customerService.getCustomerById(id, matricula)
      .first()
      .subscribe(
        (selectedCustomer: Customer) => {
          if(this.bit == true){
            this.customerService.isTheSameRate( this._internalDocumentService.currentDocument.lines, selectedCustomer)
              .first().subscribe((sameRate) => {
                if (sameRate) {
                  this.customerSelected.emit({
                    customer: selectedCustomer,
                    isFromCreateForm: false
                  });
                  this.limpiarDatos();
                } else {
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
              });
          }else{
            this.customerSelected.emit({
              customer: selectedCustomer,
              isFromCreateForm: false
            });
          }
        },
        (error) => {
          this.searchMessage = this.getLiteral('customer_search_component','error_SearchCustomer_ErrorFound');
        });
  }

  limpiarDatos() {
    this.dataSearch = '';
    this.searchMessage = '';
    this.customers = [];
  }
  getLiteral(group: string, key: string): string {
    return this._languageService.getLiteral(group, key);
  }
}


