import { Component, HostBinding, OnInit, OnDestroy } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { Subject } from 'rxjs/Subject';
import { Observable } from 'rxjs/Observable';
import { SafeResourceUrl } from '@angular/platform-browser/src/security/dom_sanitization_service';
import { FormatHelper } from 'app/helpers/format-helper';
import { OperatorInternalService } from 'app/services/operator/operator-internal.service';
import { CustomerInternalService } from 'app/services/customer/customer-internal.service';
import { AppDataConfiguration } from 'app/config/app-data.config';
import { IActionFinalizable } from '../../../shared/iaction-finalizable';
import { SignatureInternalService } from 'app/services/signature/signature-internal.service';
import { ExternalActionViewerService } from 'app/services/external-action-viewer/external-action-viewer.service';
import { ExternalActionViewerRequest } from 'app/shared/external-action-viewer/external-action-viewer-request';
import { ExternalActionViewerResponse } from 'app/shared/external-action-viewer/external-action-viewer-response';
import { KeyboardInternalService } from 'app/services/keyboard/keyboard-internal.service';
import { Subscription } from 'rxjs/Subscription';
import { isNullOrUndefined } from 'util';
import { LogHelper } from 'app/helpers/log-helper';

@Component({
    selector: 'tpv-external-actions-viewer',
    templateUrl: './external-actions-viewer.component.html',
    styleUrls: ['./external-actions-viewer.component.scss']
})
export class ExternalActionsViewerComponent implements OnInit, OnDestroy, IActionFinalizable<boolean> {
    @HostBinding('class') class = 'tpv-external-action-viewer tpv-external-act';
    private _responseReceived: Subject<boolean> = new Subject();
    _pagina: SafeResourceUrl; // TODO: las propiedades públicas no se nombran empezando por _
    _event: MessageEvent;
    private _onKeyValue: Subscription;
    onReceive: any;

    constructor(
        private _domSanitaizer: DomSanitizer,
        private _operatorInternalSrv: OperatorInternalService,
        private _customerInternalsrv: CustomerInternalService,
        private _conf: AppDataConfiguration,
        private _signatureInternalSerivce: SignatureInternalService,
        private _externalActionViewerService: ExternalActionViewerService,
        private _keyboardInternalService: KeyboardInternalService,
        private _logHelper: LogHelper
    ) {
    }

    ngOnInit() {
        this.onReceive = this._receiveMessage.bind(this);
        if (window.addEventListener) {

            window.addEventListener('message', this.onReceive, false);

        } else {

            (<any>window).attachEvent('onmessage', this.onReceive);

        }
    }

    ngOnDestroy() {
        if (window.removeEventListener) {
            window.removeEventListener('message', this.onReceive);
        } else {
            (<any>window).removeEventListener('onmessage', this.onReceive);
        }

        if (this._onKeyValue != undefined && this._onKeyValue != null) {
            this._onKeyValue.unsubscribe();
        }
    }

    private _receiveMessage(e: MessageEvent) {
        // this._keyboardInternalService.CloseKeyBoard();
        let externalMessageRequest: ExternalActionViewerRequest;
        this._event = e;
        try {
            if (typeof e.data === 'string') {
                externalMessageRequest = JSON.parse(e.data);
            } else {
                externalMessageRequest = e.data;
            }

            if (e.data.callBackFunction === 'TME_CanjeCodigoBarras' ||
                e.data.callBackFunction === 'TME_CierreDia' ||
                e.data.callBackFunction === 'TME_CierreTurno' ||
                e.data.callBackFunction === 'TME_Factura' ||
                e.data.callBackFunction === 'TME_GetInfoTicketToBill') {
                /*Promise.resolve(this._externalActionViewerService.InvokeCallBackFunctionPromise(externalMessageRequest)).then(responsePromise => {
                        e.source.postMessage(responsePromise, e.origin);
                });*/

                this._externalActionViewerService.InvokeCallBackFunctionPromise(externalMessageRequest).first().subscribe(responsePromise => {
                    e.source.postMessage(responsePromise, e.origin);
                });
            } else {

                // se llama al servicio para resolver la petición
                const dataToResponse: ExternalActionViewerResponse = this._externalActionViewerService.InvokeCallBackFunction(externalMessageRequest);
                if (dataToResponse.message == 'OK') {
                    // devuelvo la información solicitada
                    e.source.postMessage(dataToResponse, e.origin);
                }
                if (!isNullOrUndefined(dataToResponse.data)) {
                    if (dataToResponse.data.suscribeKeyboard) {
                        this.suscribeKeyboard();
                    }
                    if (dataToResponse.data.showCalendar) {
                        jQuery('#datePickerExternalAction').click();
                    }
                }

                // cierro o no el slider
                if (externalMessageRequest.closeSlider) {
                    this._responseReceived.next(true);
                }
            }
        } catch (er) {
            this._logHelper.logError('Formato de datos invalido');
            this._logHelper.logError(er);
            const errorToResponse: ExternalActionViewerResponse = { status: 400, message: 'Formato de datos invalido', data: {} };
            e.source.postMessage(errorToResponse, e.origin);
        }
    }



    onFinish(): Observable<boolean> {
        return this._responseReceived.asObservable();
    }

    forceFinish(): void {
        this._responseReceived.next(false);
    }

    set pagina(url: string) {
        try {
            const operatorId = this._operatorInternalSrv.currentOperator.id;
            const customerId = this._customerInternalsrv.currentCustomer.id;
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
                const newURL = FormatHelper.exchangeKeysByValuesForIframeUrl(url, operatorId, customerId, key[0], this._conf.company.id, signToken, this._conf.defaultPosLanguage);
                this._pagina = this._domSanitaizer.bypassSecurityTrustResourceUrl(newURL);
            } catch (e) {
                this._logHelper.logError('Firma de URL incorrecta');
                this._logHelper.logError(e);

            }
        } catch (err) {
            this._logHelper.logError('La obtención de datos ha fallado');
            this._logHelper.logError(err);
        }
    }
    suscribeKeyboard() {
        if (this._onKeyValue == undefined || this._onKeyValue == null) {
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
                }  else {
                    this._event.source.postMessage({ type: 'keyboard', value: value, action: 'letterNumber' }, this._event.origin);
                }
            });
        }
    }
    valueChange(ref: string) {
        const fechaselect = ref.split('/');
        let diaselect: string = '';
        let messelect: string = '';

        if (fechaselect[0].length === 1) {
            diaselect = '0' + fechaselect[0];
        } else {
            diaselect = fechaselect[0];
        }
        if (fechaselect[1].length === 1) {
            messelect = '0' + fechaselect[1];
        } else {
            messelect = fechaselect[1];
        }

        const nuevafecha: string = diaselect + '/' + messelect + '/' + fechaselect[2];
        this._event.source.postMessage({ type: 'calendar', value: nuevafecha, action: 'date' }, this._event.origin);
    }
}
