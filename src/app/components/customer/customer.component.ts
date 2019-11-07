import { Component, OnInit, AfterViewInit, OnDestroy, HostBinding, ViewChild } from '@angular/core';
import { SafeResourceUrl } from '@angular/platform-browser/src/security/dom_sanitization_service';
import { DomSanitizer } from '@angular/platform-browser';
import { MdTabChangeEvent } from '@angular/material';
import { Subject } from 'rxjs/Subject';
import { Observable } from 'rxjs/Observable';

import { IActionFinalizable } from 'app/shared/iaction-finalizable';
import { MinimumNeededConfiguration } from 'app/config/minimum-needed.config';
import { DynamicActionLaunchDisplayItem } from 'app/shared/dynamic-actions/dynamic-action-launch-display-item';
import { DynamicAction } from 'app/shared/dynamic-actions/dynamic-action';
import { CustomerSearchComponent } from 'app/components/customer/customer-search/customer-search.component';
import { CustomerCreationComponent } from 'app/components/customer/customer-creation/customer-creation.component';
import { CustomerSelectedResult } from 'app/shared/customer/customer-selected-result';

import { AppDataConfiguration } from 'app/config/app-data.config';
import { FormatHelper } from 'app/helpers/format-helper';
import { OperatorInternalService } from 'app/services/operator/operator-internal.service';
import { SignatureInternalService } from 'app/services/signature/signature-internal.service';

import { ExternalActionViewerService } from 'app/services/external-action-viewer/external-action-viewer.service';
import { ExternalActionViewerRequest } from 'app/shared/external-action-viewer/external-action-viewer-request';
import { ExternalActionViewerResponse } from 'app/shared/external-action-viewer/external-action-viewer-response';
import { KeyboardInternalService } from 'app/services/keyboard/keyboard-internal.service';
import { Subscription } from 'rxjs/Subscription';
import { LanguageService } from 'app/services/language/language.service';
import { ElectronicJournalService } from 'app/services/electronic-journal/electronic-journal.service';
import { ActionType } from 'app/shared/electronic-journal/action-type.enum';
import { LogHelper } from 'app/helpers/log-helper';

@Component({
  selector: 'tpv-customer',
  templateUrl: './customer.component.html',
  styleUrls: ['./customer.component.scss']
})
export class CustomerComponent implements OnInit, AfterViewInit, OnDestroy, IActionFinalizable<CustomerSelectedResult> {

  @HostBinding('class') class = 'tpv-customer';
  // para poner el foco en el input en componente hijo
  @ViewChild(CustomerSearchComponent) customerSearchChildComponent: CustomerSearchComponent;
  @ViewChild(CustomerCreationComponent) customerCreationChildComponent: CustomerCreationComponent;

  // informar de la inserción de nuevo customer
  private _onCustomerSelected: Subject<CustomerSelectedResult> = new Subject();

  createItem: DynamicActionLaunchDisplayItem;
  searchItem: DynamicActionLaunchDisplayItem;
  createFunction: DynamicAction;
  searchFunction: DynamicAction;
  _createPage: SafeResourceUrl;
  _searchPage: SafeResourceUrl;
  // decidir tab seleccionada
  customerSelectedTab = 0;
  showCreateCustomerTab = true;

  showFleet: boolean = false;
  _pagina: SafeResourceUrl; // TODO: las propiedades públicas no se nombran empezando por _
  _event: MessageEvent;
  private _onKeyValue: Subscription;
  onReceive: any;

  setFocusToCustomerSearch: boolean = false;

  constructor(
    private _config: MinimumNeededConfiguration,
    private _domSanitaizer: DomSanitizer,
    private _appDataConf: AppDataConfiguration,
    private _operatorInternalSrv: OperatorInternalService,
    private _conf: AppDataConfiguration,
    private _signatureInternalSerivce: SignatureInternalService,
    private _externalActionViewerService: ExternalActionViewerService,
    private _keyboardInternalService: KeyboardInternalService,
    private _languageService: LanguageService,
    private _electronicJournal: ElectronicJournalService,
    private  _logHelper: LogHelper
  ) {
    this.customerSelectedTab = 0;
    this.showFleet = this._appDataConf.mustRequestFleet;
  }

  set createCustomerTabVisible(value: boolean) {
    this.showCreateCustomerTab = value;
  }
  ngOnInit() {
    this.createItem = this._config.dynamicActionItemList.find(item => {
      return (item.sublocation == 'create-customer' || item.sublocation == 'Añadir Cliente');
    }, this);
    if (this.createItem !== undefined) {
      this.createFunction = this._config.dynamicActionFunctionalityList.find((item) => {
        return item.id == this.createItem.actionId;
      }, this);
      const newURLCreate = this.generateUrl(this.createFunction.action);
      this._createPage = this._domSanitaizer.bypassSecurityTrustResourceUrl(newURLCreate);
      this.initializeKeyboard();
    }
    this.searchItem = this._config.dynamicActionItemList.find(item => {
      return item.sublocation == 'search-item';
    });
    if (this.searchItem !== undefined) {
      this.searchFunction = this._config.dynamicActionFunctionalityList.find(item => {
        return item.id == this.searchItem.actionId;
      }, this);
      const newURLSearch = this.generateUrl(this.searchFunction.action);
      this._searchPage = this._domSanitaizer.bypassSecurityTrustResourceUrl(newURLSearch);
    }
  }

  ngAfterViewInit() {
    if (this.customerSearchChildComponent) {
      this.customerSearchChildComponent.setInputFocus();
    }
  }

  ngOnDestroy() {
    if (window.removeEventListener) {
      window.removeEventListener('message', this.onReceive);
    } else {
      (<any>window).removeEventListener('onmessage', this.onReceive);
    }

    if (this._onKeyValue != undefined && this._onKeyValue != undefined) {
      this._onKeyValue.unsubscribe();
    }
  }

  customerSelectionPageSelected(ev: MdTabChangeEvent) {
    this._logHelper.trace(`CustomerComponent->customerSelectionPageSelected: Selected page customer index: ${ev.index}`);
    if (ev && ev.index == 0) {
      if (this.customerSearchChildComponent) {
        this.customerSearchChildComponent.setInputFocus();
        this.customerSearchChildComponent.isCreationCustomer = false;
      }
      /*} else if (ev && ev.index == 1) {
        if (this.customerSearchChildComponent) {
          this.setFocusToCustomerSearch = true;
        }*/
    } else if (ev && ev.index == 1) {
      if (this.customerSearchChildComponent) {
        this.customerSearchChildComponent.isCreationCustomer = true;
        this.setFocusToCustomerSearch = false;
        this.customerCreationChildComponent.setInputFocus();
      }
    } else {
      return;
    }
  }

  onCustomerSelected(customer: CustomerSelectedResult): void {
    // Electronic Journal - customerSet
    this._electronicJournal.writeAction({
      type: ActionType.customerSet,
      customerCode: customer.customer.id.replace(this._appDataConf.company.id, ''),
      genericDetail: customer.customer.cardInformation != undefined ? customer.customer.cardInformation.contactId : undefined,
    });
    this._onCustomerSelected.next(customer);
  }
  onFinish(): Observable<CustomerSelectedResult> {
    return this._onCustomerSelected.asObservable();
  }

  forceFinish(): void {
    this._onCustomerSelected.next(undefined);
  }

  generateUrl(url: string): string {
    try {
      const operatorId = this._operatorInternalSrv.currentOperator.id;
      const conf = this._conf.userConfiguration;
      // consigo la key
      const key = this._signatureInternalSerivce.DisassembleToken(conf.Identity);

      try {
        // concateno los datos a firmar string variableSource = Guid+operador+timestamp+timestamputc+secretKey
        const variableSource = key[0] +
          operatorId +
          FormatHelper.dateToISOString(new Date()) +
          FormatHelper.dateToISOString(FormatHelper.formatToUTCDateFromLocalDate(new Date())) +
          key[3];

        // firmo la cadena anterior
        const signToken = this._signatureInternalSerivce.Sign(variableSource, key[3], true);
        // formateo el URL para hacer la petición
        const newURL = FormatHelper.exchangeKeysByValuesForIframeUrl(url, operatorId, '', key[0], this._conf.company.id, signToken, this._conf.defaultPosLanguage);
        return newURL;
      } catch (e) {
        this._logHelper.logError('Firma de URL incorrecta');
        this._logHelper.logError(e);
        return url;

      }
    } catch (err) {
      this._logHelper.logError('La obtención de datos ha fallado');
      this._logHelper.logError(err);
      return url;
    }
  }

  initializeKeyboard() {
    this.onReceive = this._receiveMessage.bind(this);
    if (window.addEventListener) {

      window.addEventListener('message', this.onReceive, false);

    } else {

      (<any>window).attachEvent('onmessage', this.onReceive);

    }
  }

  private _receiveMessage(e: MessageEvent) {
    let externalMessageRequest: ExternalActionViewerRequest;
    this._event = e;
    try {
      if (typeof e.data === 'string') {
        externalMessageRequest = JSON.parse(e.data);
      } else {
        externalMessageRequest = e.data;
      }
      // se llama al servicio para resolver la petición
      const dataToResponse: ExternalActionViewerResponse = this._externalActionViewerService.InvokeCallBackFunction(externalMessageRequest);

      // devuelvo la información solicitada
      e.source.postMessage(dataToResponse, e.origin);

      if (dataToResponse.data.suscribeKeyboard) {
        this.suscribeKeyboard();
      }
    } catch (er) {
      this._logHelper.logError('Formato de datos invalido');
      this._logHelper.logError(er);
      const errorToResponse: ExternalActionViewerResponse = { status: 400, message: 'Formato de datos invalido', data: {} };
      e.source.postMessage(errorToResponse, e.origin);
    }
  }

  suscribeKeyboard() {
    if (this._onKeyValue == undefined || this._onKeyValue == undefined) {
      this._onKeyValue = this._keyboardInternalService.keyValue$.subscribe(value => {
        if (value == 'close') {
          this._onKeyValue.unsubscribe();
          this._onKeyValue = undefined;
        } else if (value == 'delete') {
          this._event.source.postMessage({ type: 'keyboard', value: value, action: 'delete' }, this._event.origin);
        } else if (value == ' ') {
          this._event.source.postMessage({ type: 'keyboard', value: value, action: 'space' }, this._event.origin);
        } else if (value == 'enter') {
          this._event.source.postMessage({ type: 'keyboard', value: value, action: 'enter' }, this._event.origin);
        } else {
          this._event.source.postMessage({ type: 'keyboard', value: value, action: 'letterNumber' }, this._event.origin);
        }
      });
    }
  }
  getLiteral(group: string, key: string): string {
    return this._languageService.getLiteral(group, key);
  }
}
