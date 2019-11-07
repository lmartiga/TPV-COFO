import { Injectable } from '@angular/core';
import { Subject } from 'rxjs/Subject';
import { Observable } from 'rxjs/Observable';
import { Customer } from 'app/shared/customer/customer';
import { SlideOverService } from 'app/services/slide-over/slide-over.service';
import { CustomerService } from 'app/services/customer/customer.service';
import { CustomerComponent } from 'app/components/customer/customer.component';
import { AppDataConfiguration } from 'app/config/app-data.config';
import { Subscriber } from 'rxjs/Subscriber';
import { CustomerSelectedResult } from 'app/shared/customer/customer-selected-result';
import { CustomerAddInformationResult } from 'app/shared/customer-add-information/customer-add-information-result';
import { CustomerAddInformationComponent } from 'app/components/customer/customer-add-information/customer-add-information.component';
import { CustomerAddInformationRequest } from '../../shared/customer-add-information/customer-add-information-request';
import { LogHelper } from 'app/helpers/log-helper';

@Injectable()
export class CustomerInternalService {

  private _currentCustomerChanged: Subject<Customer> = new Subject();

  private _currentCustomer: Customer;
  private _defaultCustomer: Customer;

  constructor(
    private _slideOver: SlideOverService,
    private _appDataConfig: AppDataConfiguration,
    private _customerService: CustomerService,
    private  _logHelper: LogHelper
  ) {
  }

  set currentCustomer(customer: Customer) {
    this._currentCustomerChanged.next(customer);
    this._currentCustomer = customer;
  }
  get currentCustomer(): Customer {
    return this._currentCustomer;
  }

  get defaultCustomer(): Customer {
    return this._defaultCustomer;
  }

  customerChanged(): Observable<Customer> {
    return this._currentCustomerChanged.asObservable();
  }

  requestCustomer(isRequestingCustomer: boolean, showCreateTab: boolean): Observable<CustomerSelectedResult> {
    return Observable.create((suscriber: Subscriber<CustomerSelectedResult>) => {
      // vemos si hay cliente por defecto de configuracion
      if (this._appDataConfig.defaultCustomer && !isRequestingCustomer) {
        this._getDefaultCustomer(this._appDataConfig.defaultCustomer)
          .first()
          .subscribe(customer => {
            if (customer) {
              this._defaultCustomer = customer;
              suscriber.next({ customer: customer, isFromCreateForm: false });
            } else {
              this._logHelper.trace('Se ha producido un error en la búsqueda del cliente por defecto.');
            }
          });
      } else {
        // si no hay por defecto, se pide con el panel auxiliar
        this.getCustomer(showCreateTab)
          .first()
          .subscribe(customerResult => {
            suscriber.next(customerResult);
          });
      }
    });
  }
  /**
   * Muestra al usuario seleccion de cliente y despues de adicion de informacion (plate) si fuese necesario
   * (ej si es creado desde formulario no es necesario pedir nada mas)
   */
  requestCustomerForInvoice(): Observable<CustomerSelectedResult> {
    return Observable.create((subscriber: Subscriber<CustomerSelectedResult>) => {
      this.getCustomer(true)
        .first().subscribe(customerResult => {
          if (customerResult == undefined || customerResult.customer == undefined || customerResult.isFromCreateForm
            || !this._appDataConfig.mustRequestCustomerPlate) {
            // tanto si es undefined, como si ha sido creado desde formulario, no mostramos pantalla de AddInfo.
            // si no se requiere pedir matricula no se muestra tampoco la pantalla AddInfo
            // si ha sido creado, contendra informacion de cliente y matricula
            subscriber.next(customerResult);
            return;
          }
          // pedimos la informacion de matricula
          this.requestAddCustomerInformation({
            customer: customerResult.customer,
            editPlate: false
          })
            .first().subscribe(addInfoResult => {
              if (addInfoResult == undefined || !addInfoResult.success) {
                subscriber.next(undefined);
                return;
              }
              if (addInfoResult.changeCustomerRequested) {
                // ha solicitado cambio de cliente, volvemos al inicio
                this.requestCustomerForInvoice() // recursiva
                  .first().subscribe(recursiveResult => {
                    subscriber.next(recursiveResult);
                    return;
                  });
                return;
              }
              // devolvemos cliente y matricula introducida
              subscriber.next({
                customer: customerResult.customer,
                isFromCreateForm: false,
                plate: addInfoResult.plate
              });
              return;
            });

        });
    });

  }
  requestAddCustomerInformation(
    addInfoParams: CustomerAddInformationRequest
  ): Observable<CustomerAddInformationResult> {
    const componentRef = this._slideOver.openFromComponent(CustomerAddInformationComponent);
    componentRef.instance.addInformationRequest = addInfoParams;
    return componentRef.instance.onFinish();
  }
  // Se tiene que poner aquí en lugar de en el manager por warning de referencia circular
  // slide to get customer
  private getCustomer(showCreateTab = true): Observable<CustomerSelectedResult> {
    this._logHelper.trace('CustomerInternalService-> Se solicita cliente');
    const componentRef = this._slideOver.openFromComponent(CustomerComponent);
    componentRef.instance.createCustomerTabVisible = showCreateTab;
    return componentRef.instance.onFinish();
  }

  isUnknownCustomer(customerId: string): boolean {
    return this._appDataConfig.unknownCustomerId == customerId;
  }
  // pide el cliente por defecto

  private _getDefaultCustomer(defaultCustomerId: string): Observable<Customer> {
    return Observable.create((suscriber: Subscriber<Customer>) => {
      this._customerService.getDefaultCustomerById(defaultCustomerId)
        .first()
        .subscribe(customer => {
          suscriber.next(customer);
        });
    });
  }
}
