import { Injectable, OnInit } from '@angular/core';
import { DocumentInternalService } from 'app/services/document/document-internal.service';
import { ExternalActionViewerResponse } from 'app/shared/external-action-viewer/external-action-viewer-response';
import { ExternalActionViewerRequest } from 'app/shared/external-action-viewer/external-action-viewer-request';
import { StatusBarService } from 'app/services/status-bar/status-bar.service';
import { KeyboardInternalService } from 'app/services/keyboard/keyboard-internal.service';
import { CashboxOfflineService } from 'app/src/custom/services/cash-offline-services/cashbox-offline.service';
import { CashboxClosureServiceOffline } from 'app/src/custom/services/cashbox-closure-offline-services/cashbox-closure-offline.service';
import { SignalRTMEService } from '../signalr/signalr-tme.service';
import { Observable } from 'rxjs/Observable';
import { Subscriber } from 'rxjs/Subscriber';
import { TMEButtonCierreResponseStatuses } from 'app/shared/hubble-pos-signalr-responses/tme-button-cierre-response-statuses.enum';
import { TMEGetInfoBillResponseStatuses } from 'app/shared/hubble-pos-signalr-responses/tme-get-info-ticket-to-bill-response-statuses.enum';
import { TMEButtonFacturarResponseStatuses } from 'app/shared/hubble-pos-signalr-responses/tme-button-facturar-response-statuses.enum';
import { DocumentService } from '../document/document.service';
import { OperatorInternalService } from 'app/services/operator/operator-internal.service';
import { SlideOverService } from 'app/services/slide-over/slide-over.service';
// import { TpvMainService } from 'app/services/tpv/tpv-main.service';
import { isNullOrUndefined } from 'util';
import { SignalRPSSService } from '../signalr/signalr-pss.service';
import { SuplyTransaction } from 'app/shared/fuelling-point/suply-transaction';
import { Guid } from 'app/helpers/guid';
import { FinalizeSupplyTransactionStatus } from 'app/shared/hubble-pos-signalr-responses/finalize-supply-transaction-status.enum';
import { OperatorService } from '../operator/operator.service';
import { LanguageService } from 'app/services/language/language.service';
import { TmeService } from '../tme/tme.service';
import { CashboxClosureOfflineComponent } from 'app/src/custom/components/cashbox-closure-offline/cashbox-closure-offline.component';
import { SuplyTransactionType } from 'app/shared/fuelling-point/suply-transaction-type.enum';
import { ServiceModeType } from 'app/shared/fuelling-point/service-mode-type.enum';
import { CashboxClosureService } from '../cashbox-closure/cashbox-closure.service';
import { BusinessType } from 'app/shared/business-type.enum';
import { LogHelper } from 'app/helpers/log-helper';

@Injectable()
export class ExternalActionViewerService implements OnInit {

    constructor(
        private _operadorService: OperatorService,
        private _pssSvc: SignalRPSSService,
        private cashboxInOutService: CashboxOfflineService,
        private cashboxClosureServiceOffline: CashboxClosureServiceOffline,
        private documentInternalService: DocumentInternalService,
        private statusBarService: StatusBarService,
        private _documentService: DocumentService,
        private _keyboardInternalService: KeyboardInternalService,
        private _signalRTMEService: SignalRTMEService,
        private _slideoverservice: SlideOverService,
        private _operatorservice: OperatorInternalService,
        private _languageService: LanguageService,
        private _TMEService: TmeService,
        private _CashboxService: CashboxClosureService,
        private  _logHelper: LogHelper) { }


    ngOnInit() {

    }

    public InvokeCallBackFunction(externalMessageResponse: ExternalActionViewerRequest): ExternalActionViewerResponse {

        switch (externalMessageResponse.callBackFunction) {
            case 'GetCashboxCloseInfo':
                return this._cashboxCloseInfo(externalMessageResponse.data, externalMessageResponse.pageKey);
            case 'GetCashboxCloseError':
                return this._cashboxCloseError(externalMessageResponse.data);
            case 'GetCashboxRecordReasonsOffline':
                return this._cashboxInOut(externalMessageResponse.data);
            case 'DeleteDocumentData':
                return this._deleteDocumentData();
            case 'ShowStatusBarMessage':
                return this._showStatusBarMessage(externalMessageResponse.data.message);
            case 'GetCurrentDocument':
                return this._getCurrentDocument();
            case 'GetCurrentDocumentLines':
                return this._getCurrentDocumentLines();
            case 'FinalizeSupplyTransaction':
                return this._finalizeSupplyTransaction();
            case 'ShowKeyboard':
                return this._showKeyboard(
                    externalMessageResponse.data.type,
                    externalMessageResponse.data.dato,
                    externalMessageResponse.data.posicion,
                    externalMessageResponse.data.maxlength,
                    externalMessageResponse.data.posicioninicial);
            case 'ShowCalendar':
                return this._showCalendar();
            case 'CloseKeyboard':
                return this._closeKeyboard();
            case 'KeyDown':
                return this._onKeyDown(externalMessageResponse.data.type, externalMessageResponse.data.key, externalMessageResponse.data.dato);
            case 'KeyUp':
                return this._onKeyUp(externalMessageResponse.data.key);
            case 'ResetDocumentData':
                return this._resetDocumentData();
            case 'ClearDocumentData':
                return this._clearDocumentData();
            // llamar pantalla operador
            case 'CallOperatorTPV':
                return this._CallOperatorTPV();
            case 'PrintFromAspx':
                return this._printFromAspx(externalMessageResponse.data, externalMessageResponse.pageKey);
            case 'PrintFromAspxCalibration':
                const document = JSON.parse(externalMessageResponse.data.stringifiedDocumentData);
                const listaSumiAnul: SuplyTransaction[] = [];
                const sumanul: SuplyTransaction = {
                    id: 0, gradeId: 0, fuellingPointId: 0,
                    type: SuplyTransactionType.PostpaidNoLocked,
                    gradeUnitPrice: 0, gradeReference: '0', money: 0,
                    volume: 0, serviceModeType: ServiceModeType.PostPaid,
                    startDateTime: new Date(''), finishDateTime: new Date(''),
                    nTienda: this.documentInternalService.currentDocument.currencyId.substring(0, 5)
                };
                sumanul.id = document.Document.supplyId;
                this.documentInternalService.resetDocumentData();
                listaSumiAnul.push(sumanul);
                this._documentService.DeleteSuppliesAnulated(listaSumiAnul);
                this._printFromAspx(externalMessageResponse.data, externalMessageResponse.pageKey);
                return { status: 200, message: 'OK', data: { respuesta: 'ok' } };
            default:
                return { status: 404, message: 'externalMessageResponse.callBackFunction invalid', data: {} };
        }
    }

    public InvokeCallBackFunctionPromise(externalMessageRequest: ExternalActionViewerRequest): Observable<ExternalActionViewerResponse> {
        return Observable.create((observer: Subscriber<ExternalActionViewerResponse>) => {
            switch (externalMessageRequest.callBackFunction) {
                case 'TME_CanjeCodigoBarras':
                    this._TME_CanjeCodigoBarras(this.documentInternalService.currentDocument).first().subscribe(response => {
                        if (response) {
                            observer.next({ status: 200, message: 'OK', data: {} });
                        } else {
                            observer.next({ status: 200, message: 'KO', data: {} });
                        }
                    });
                    break;
                case 'TME_CierreDia':
                    this._TME_Cierre(4).first().subscribe(response => {
                        setTimeout(() => {
                            this.statusBarService.resetProgress();
                        }, 3000);
                        if (response) {
                            observer.next({ status: 200, message: 'OK', data: {} });
                        } else {
                            observer.next({ status: 200, message: 'KO', data: {} });
                        }
                    });
                    break;
                case 'TME_CierreTurno':
                    this._TME_Cierre(5).first().subscribe(response => {
                        setTimeout(() => {
                            this.statusBarService.resetProgress();
                        }, 3000);
                        if (response) {
                            observer.next({ status: 200, message: 'OK', data: {} });
                        } else {
                            observer.next({ status: 200, message: 'KO', data: {} });
                        }
                    });
                    break;
                case 'TME_Factura':
                    this._TME_Factura(externalMessageRequest.data.jsonEnvio2).first().subscribe(response => {
                        setTimeout(() => {
                            this.statusBarService.resetProgress();
                        }, 3000);
                        if (response) {
                            observer.next({ status: 200, message: 'OK', data: 'Facturado' });
                        } else {
                            observer.next({ status: 200, message: 'KO', data: {} });
                        }
                    });
                    break;
                case 'TME_GetInfoTicketToBill':
                    this._GetInfoTicketToBill(
                        this.documentInternalService.currentDocument.operator.code, externalMessageRequest.data.numerodocument)
                        .first().subscribe(response => {
                            setTimeout(() => {
                                this.statusBarService.resetProgress();
                            }, 3000);
                            if (response !== undefined) {
                                if (response.status === TMEGetInfoBillResponseStatuses.successful) {
                                    observer.next({ status: 200, message: 'OK', data: response });
                                }
                            } else {
                                observer.next({ status: 200, message: 'KO', data: {} });
                            }
                        });
                    break;
                default:
                    observer.next({ status: 404, message: 'externalMessageResponse.callBackFunction invalid', data: {} });

            }
        });
    }

    private _TME_CanjeCodigoBarras(document: any): Observable<boolean> {
        return this._documentService.sendSaleDocumentsCanjeCodigoBarras([document]);
    }

    private _TME_Cierre(tipoCierre: number): Observable<boolean> {
        return Observable.create((observer: Subscriber<boolean>) => {
            this._TMEService.setTMEOcupado(true);
            Promise.resolve(this._TMEService.TMEButtonCierre(tipoCierre)).then(responseTME => {
                if (responseTME.status === TMEButtonCierreResponseStatuses.successful) {
                    this.statusBarService.publishMessage(
                        this._languageService.getLiteral('external_action_viewer_service', 'statusBar_ClosingDoneCorrectly'));
                    observer.next(true);
                } else if (responseTME.status === TMEButtonCierreResponseStatuses.genericError) {
                    this.statusBarService.publishMessage(responseTME.message);
                    observer.next(false);
                }
                this._TMEService.setTMEOcupado(false);
            });
        });
    }

    private _GetInfoTicketToBill(strOperatorCode: string, strDocumentNumberToBill: string): Observable<any> {
        return Observable.create((observer: Subscriber<any>) => {
            this._TMEService.setTMEOcupado(true);
            Promise.resolve(this._TMEService.TMEGetInfoTicketToBill(strOperatorCode, strDocumentNumberToBill)).then(responseTME => {
                if (responseTME.status === TMEGetInfoBillResponseStatuses.successful) {
                    observer.next(responseTME);
                } else if (responseTME.status === TMEGetInfoBillResponseStatuses.genericError) {
                    this.statusBarService.publishMessage(responseTME.message);
                    observer.next(undefined);
                }
                this._TMEService.setTMEOcupado(false);
            });
        });
    }

    private _TME_Factura(json: any): Observable<boolean> {
        return Observable.create((observer: Subscriber<boolean>) => {
            this._TMEService.setTMEOcupado(true);
            Promise.resolve(this._TMEService.TMEButtonFacturar(json).then(responseTME => {
                if (responseTME.status === TMEButtonFacturarResponseStatuses.successful) {
                    observer.next(true);
                } else if (responseTME.status === TMEButtonFacturarResponseStatuses.genericError) {
                    this.statusBarService.publishMessage(responseTME.message);
                    observer.next(false);
                }
                this._TMEService.setTMEOcupado(false);
            }));
        });
    }

    private _cashboxInOut(data: any): ExternalActionViewerResponse {
        this.cashboxInOutService.llamadaAspxReplica(data);
        return { status: 200, message: 'OK', data: {} };
    }
    private _cashboxCloseInfo(data: any, keyPage: string): ExternalActionViewerResponse {
        this._printFromAspx(data.DatosImpresion, keyPage);
        this._operadorService.limpiadoOperador(data.DatosCierre.cierre.operador).first()
            .subscribe(response => {
                if (response) {
                    this.cashboxClosureServiceOffline.llamadaAspxReplica(data.DatosCierre);
                    this._slideoverservice._CloseSlider(); // cerramos el slide de la pantalla
                    this._operatorservice.ObsOperador(undefined);
                    // this._operatorservice.getOperator(); // consultar a Luis Martín (incluido para invocar al operador)
                    // this._tpvMainService.setPluVisible(true);
                }
            });
        return { status: 200, message: 'OK', data: {} };
    }

    private _cashboxCloseError(data: any): ExternalActionViewerResponse {
        this._slideoverservice._CloseSlider(); // cerramos el slide de la pantalla

        const componentRef = this._slideoverservice.openFromComponent(CashboxClosureOfflineComponent);
        componentRef.instance.onFinish();

        return { status: 200, message: 'OK', data: {} };
    }

    private _getCurrentDocument(): ExternalActionViewerResponse {
        const lines = this.documentInternalService.currentDocument.lines;
        if (lines != undefined) {
            for (let i = 0; i < this.documentInternalService.currentDocument.lines.length; i++) {
                if (this.documentInternalService.currentDocument.lines[i]) {
                    const isSupplyTransaction = this.documentInternalService.currentDocument.lines[i].businessSpecificLineInfo;
                    if (isSupplyTransaction) {
                        return { status: 0, message: 'OK', data: {} };
                    }
                }
            }
        }

        return { status: 200, message: 'OK', data: this.documentInternalService.currentDocument };
    }

    private _getCurrentDocumentLines(): ExternalActionViewerResponse {

        // const line = this.documentInternalService.currentDocument.lines[0];
        const line = this.documentInternalService.currentDocument.lines.find(
            y => y.businessSpecificLineInfo != undefined &&
            y.businessSpecificLineInfo.type == BusinessType.gasStation
            && y.isRemoved != false);

        let datos: any;
        if (isNullOrUndefined(line)) {
            datos = undefined;
        } else {
            datos = {
                producto: line.productId,
                cantidad: line.quantity,
                tipoarticulo: line.typeArticle,
                cantidadlines: this.documentInternalService.currentDocument.lines.filter(
                    x => x.businessSpecificLineInfo != undefined &&
                    x.businessSpecificLineInfo.type == BusinessType.gasStation &&
                    x.isRemoved != false).length,
                businessSpecificLineInfo: {
                    type: line.businessSpecificLineInfo.type,
                    fuellingPointId: line.businessSpecificLineInfo.supplyTransaction.fuellingPointId,
                    supplyTransactionId: line.businessSpecificLineInfo.supplyTransaction.id,
                    anulated: line.businessSpecificLineInfo.supplyTransaction.anulated
                }
            };
        }
        return { status: 200, message: 'OK', data: datos };
    }

    private _finalizeSupplyTransaction(): ExternalActionViewerResponse {
        const document = this.documentInternalService.currentDocument;
        const Fuelling = this.documentInternalService.currentDocument.lines.find(
            y => y.businessSpecificLineInfo != undefined &&
            y.businessSpecificLineInfo.type == BusinessType.gasStation &&
            y.isRemoved != false);
        if (Fuelling.businessSpecificLineInfo.supplyTransaction.anulated != true) {
            this._pssSvc.finalizeSupplyTransaction(document.operator.id,
                Fuelling.businessSpecificLineInfo.supplyTransaction.id,
                Fuelling.businessSpecificLineInfo.supplyTransaction.fuellingPointId,
                document.customer.id,
                Guid.newGuid(),
                '123',
                1
            )
                .first().subscribe(resp => {
                    if (resp.status == FinalizeSupplyTransactionStatus.Successful) {
                        this.documentInternalService.resetDocumentData();
                    }
                });
        } else {
            this.documentInternalService.resetDocumentData();
        }
        return { status: 200, message: 'OK', data: { respuesta: 'ok' } };
    }


    private _deleteDocumentData(): ExternalActionViewerResponse {
        this.documentInternalService.deleteDocumentData();
        return { status: 200, message: 'OK', data: {} };
    }

    private _showStatusBarMessage(message: string): ExternalActionViewerResponse {

        if (message != undefined) {
            this.statusBarService.publishMessage(message);
            return { status: 200, message: 'OK', data: {} };
        }
        return { status: 400, message: 'El mensaje no puede ser undefined', data: {} };
    }
    // tslint:disable-next-line:max-line-length
    private _showKeyboard(type: string, value?: string, posicion?: number, maxlength?: string, posicioninicial?: number): ExternalActionViewerResponse {
        if (type == 'number' || type == 'text') {
            this._keyboardInternalService.ShowTwoPoints(false);
            this._keyboardInternalService.SendType(type);
            this._keyboardInternalService.SendInputValue(value);
            this._keyboardInternalService.SendPosition(posicion);
            this._keyboardInternalService.SendMaxLength(maxlength);
            this._keyboardInternalService.SendPosicionInicial(posicioninicial);
        } else if (type == 'time') {
            this._keyboardInternalService.ShowTwoPoints(true);
            this._keyboardInternalService.SendType('number');
            this._keyboardInternalService.SendInputValue(value);
            this._keyboardInternalService.SendPosition(posicion);
        }
        this._keyboardInternalService.ShowKeyBoard();
        return { status: 200, message: 'OK', data: { suscribeKeyboard: true } };
    }
    private _showCalendar(): ExternalActionViewerResponse {
        return { status: 200, message: 'OK', data: { showCalendar: true } };
    }

    private _closeKeyboard(): ExternalActionViewerResponse {
        this._keyboardInternalService.CloseKeyBoard();
        return { status: 200, message: 'OK', data: {} };
    }

    private _onKeyDown(type?: string, key?: string, value?: string): ExternalActionViewerResponse {
        this._keyboardInternalService.SendType(type);
        this._keyboardInternalService.SendInputValue(value);
        this._keyboardInternalService.ShowEventKeyPress(key);
        this._keyboardInternalService.SendPosition(value.length + 1);
        return { status: 200, message: 'OK', data: {} };
    }

    private _onKeyUp(key?: string): ExternalActionViewerResponse {
        this._keyboardInternalService.ShowEventKeyUp(key);
        return { status: 200, message: 'OK', data: {} };
    }
    private _resetDocumentData(): ExternalActionViewerResponse {
        this.documentInternalService.resetDocumentData();
        return { status: 200, message: 'OK', data: {} };
    }

    private _clearDocumentData(): ExternalActionViewerResponse {
        this.documentInternalService.clearDocumentData();
        return { status: 200, message: 'OK', data: {} };
    }
    // llama pantalla operador
    private _CallOperatorTPV(): ExternalActionViewerResponse {
        this._operatorservice.getOperator();
        return { status: 200, message: 'OK', data: {} };
    }

    private _printFromAspx(data: any, keyPage: string): ExternalActionViewerResponse {
        let sendPrintFunc: Observable<boolean>;

        // Comprobamos que viene del cierre ONLINE y ejecutamos el cierre de Turno en el TME
        if (this._signalRTMEService.getStatusConnection() && keyPage === 'RepsolTPVCashBoxClosurePrintKey') {
            this._CashboxService.fnCierreCajaSubject(true);
            Promise.resolve(this._TMEService.TMEButtonCierre(5)).then(responseTME => {
                if (responseTME.status === TMEButtonCierreResponseStatuses.successful) {
                    this.statusBarService.publishMessage(
                        this._languageService.getLiteral('external_action_viewer_service', 'statusBar_ClosingDoneCorrectly'));
                } else if (responseTME.status === TMEButtonCierreResponseStatuses.genericError) {
                    this.statusBarService.publishMessage(responseTME.message);
                }
            });
        }
        if (keyPage === 'RepsolTPVCashBoxClosurePrintKey') {
            this._CashboxService.fnCierreCajaSubject(true);
        }

        sendPrintFunc = this._documentService.sendPrintDirectHub(data.stringifiedDocumentData, data.templateName);
        sendPrintFunc.first().subscribe(
            response => {
                this._logHelper.trace('TODO OK IMPRESION desde ASPX', response);
            }, (err) => this._logHelper.logError(' Error impresion desde ASPX:', err));
        return { status: 200, message: 'OK', data: { type: keyPage } };
    }

}
