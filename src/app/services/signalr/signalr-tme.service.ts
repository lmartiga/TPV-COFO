import { Injectable, OnDestroy } from '@angular/core';
import { ISignalRConnectionManager } from 'app/shared/isignalr-conection-manager';
import { TMEApplicationInitResponse } from 'app/shared/hubble-pos-signalr-responses/tme-application-init-response';
import { TMEApplicationSyncResponse } from 'app/shared/hubble-pos-signalr-responses/tme-application-sync-response';
import { TMEButtonExactoResponse } from 'app/shared/hubble-pos-signalr-responses/tme-button-exacto-response';
import { TMEButtonTestResponse } from 'app/shared/hubble-pos-signalr-responses/tme-button-test-response';
import { TMEButtonTarjetaResponse } from 'app/shared/hubble-pos-signalr-responses/tme-button-tarjeta-response';
import { TMEButtonMixtoResponse } from 'app/shared/hubble-pos-signalr-responses/tme-button-mixto-response';
import { TMEButtonRefundFuelResponse } from 'app/shared/hubble-pos-signalr-responses/tme-button-refund-fuel-response';
import { TMEButtonRefundCompleteResponse } from 'app/shared/hubble-pos-signalr-responses/tme-button-refund-complete-response';
import { TMEGetInfoBillResponse } from 'app/shared/hubble-pos-signalr-responses/tme-get-info-ticket-to-bill-response';
import { TMEButtonFacturarResponse } from 'app/shared/hubble-pos-signalr-responses/tme-button-facturar-response';
import { TMEButtonCanjeCodigoBarrasResponse } from 'app/shared/hubble-pos-signalr-responses/tme-button-canje-codigo-barras-response';
import { TMEButtonCierreResponse } from 'app/shared/hubble-pos-signalr-responses/tme-button-cierre-response';
import { Subject } from 'rxjs/Subject';
import { Observable } from 'rxjs/Observable';
import { TmeService } from '../tme/tme.service';
import { LogHelper } from 'app/helpers/log-helper';

@Injectable()
export class SignalRTMEService implements OnDestroy {
    private _hubProxy: SignalR.Hub.Proxy;
    private _connectionManager: ISignalRConnectionManager;
    private _statusConnection: boolean;
    private _onConnectionStateChanged: Subject<boolean> = new Subject();
    private _tmeService: TmeService;
    private _reconnectedTimeout: number = 30000;
    constructor(
        private  _logHelper: LogHelper
    ) {
    }

    ngOnDestroy() {
        // Se agrega eliminación de suscripción a TME
        this._hubProxy.off('OnTME_ConnectionStateChanged', _ => this.setConnectionStateChange(undefined));
    }

    setConnectionManager(connectionManager: ISignalRConnectionManager): SignalRTMEService {
        if (connectionManager == undefined) {
            const errorMessage: string = 'ERROR -> connectionManager parameter cannot be null';
            this._logHelper.trace(errorMessage);
            throw new Error(errorMessage);
        }
        this._connectionManager = connectionManager;
        return this;
    }

    init(): SignalRTMEService {
        // Creamos el proxy
        this._hubProxy = this._connectionManager.createHubProxy('tmeHub');
        this._hubProxy.on('OnTME_ConnectionStateChanged', (param: boolean) => this.setConnectionStateChange(param));
        return this;
    }

    setConnectionStateChange(param: boolean) {
        this.setStatusConnection(param);
    }

    onConnectionStatusChanged(): Observable<boolean> {
        return this._onConnectionStateChanged.asObservable();
    }

    // SetStatusConnection
    setStatusConnection(status: boolean) {
        if (this._tmeService !== undefined && this._tmeService.getTMEOcupado() === true) {
            this._statusConnection = true;
            this._onConnectionStateChanged.next(true);
        }
        else {
            this._statusConnection = status;
            this._onConnectionStateChanged.next(status);
        }
    }

    // GetStatusConnection
    getStatusConnection(): boolean {
        return this._statusConnection;
    }

    // GetReconnectedTimeout
    getReconnectedTimeout(): number {
        return this._reconnectedTimeout;
    }

    // Synchronization
    startSyncProcess(): Promise<TMEApplicationSyncResponse> {
        return this._hubProxy.invoke('TMEApplicationSync');
    }
    // Init
    startInitializationProcess(): Promise<TMEApplicationInitResponse> {
        return this._hubProxy.invoke('TMEApplicationInit');
    }

    // Button Test
    TMEButtonTest(): Promise<TMEButtonTestResponse> {
        return this._hubProxy.invoke('TMEButtonTest');
    }

    // Button Exacto TME
    TMEButtonExacto(document: any, numLinePrepaid: number): Promise<TMEButtonExactoResponse> {
        return this._hubProxy.invoke('TMEButtonExacto', document, numLinePrepaid);
    }

    // Button Tarjeta TME
    TMEButtonTarjeta(document: any, numLinePrepaid: number): Promise<TMEButtonTarjetaResponse> {
        return this._hubProxy.invoke('TMEButtonTarjeta', document, numLinePrepaid);
    }

    // Button Mixto TME
    TMEButtonMixto(document: any, numLinePrepaid: number): Promise<TMEButtonMixtoResponse> {
        return this._hubProxy.invoke('TMEButtonMixto', document, numLinePrepaid);
    }

    // Button Mixto TME
    TMEButtonMixtoEfectivo(document: any, numLinePrepaid: number): Promise<TMEButtonMixtoResponse> {
        return this._hubProxy.invoke('TMEButtonMixtoEfectivo', document, numLinePrepaid);
    }

    // Button Devolución Prepago TME
    TMEButtonRefundFuel(document: any, strOperatorCode: string): Promise<TMEButtonRefundFuelResponse> {
        return this._hubProxy.invoke('TMEButtonRefundFuel', document, strOperatorCode);
    }

    // Button Devolución Completa TME
    TMEButtonRefundComplete(document: any, strOperatorCode: string): Promise<TMEButtonRefundCompleteResponse> {
        return this._hubProxy.invoke('TMEButtonRefundComplete', document, strOperatorCode);
    }

    TMEGetInfoTicketToBill(strOperatorCode: string, strDocumentNumberToBill: string): Promise<TMEGetInfoBillResponse> {
        return this._hubProxy.invoke('TMEGetInfoTicketToBill', strOperatorCode, strDocumentNumberToBill);
    }

    TMEButtonFacturar(strTMEGetInfoBillResponse: any): Promise<TMEButtonFacturarResponse> {
        return this._hubProxy.invoke('TMEButtonFacturar', strTMEGetInfoBillResponse);
    }

    TMEButtonCanjeCodigoBarras(document: any): Promise<TMEButtonCanjeCodigoBarrasResponse> {
        return this._hubProxy.invoke('TMEButtonCanjeCodigoBarras', document);
    }

    TMEButtonCierre(tipoCierre: number): Promise<TMEButtonCierreResponse> {
        return this._hubProxy.invoke('TMEButtonCierre', tipoCierre);
    }
}
