import { Injectable, OnDestroy } from '@angular/core';
import { ISignalRConnectionManager } from 'app/shared/isignalr-conection-manager';
import { OPOSWriteDisplayResponse } from 'app/shared/hubble-pos-signalr-responses/opos-writedisplay-response';
import { OPOSClearLineDisplayResponse } from 'app/shared/hubble-pos-signalr-responses/opos-clearlinedisplay-response';
import { OPOSOpenCashDrawerResponse } from 'app/shared/hubble-pos-signalr-responses/opos-opencashdrawer-response';
import { OPOSDisplayApplicationInitResponse } from 'app/shared/hubble-pos-signalr-responses/opos-displayappinit-response';
import { OPOSCashDrawerApplicationInitResponse } from 'app/shared/hubble-pos-signalr-responses/opos-cashdrawerappinit-response';
import { Subject } from 'rxjs/Subject';
import { Observable } from 'rxjs/Observable';
import { LogHelper } from 'app/helpers/log-helper';

@Injectable()
export class SignalROPOSService implements OnDestroy {
    private _hubProxy: SignalR.Hub.Proxy;
    private _connectionManager: ISignalRConnectionManager;
    private _statusConnection: boolean;
    private _onConnectionStateChanged: Subject<boolean> = new Subject();

    constructor(private  _logHelper: LogHelper) {
    }

    ngOnDestroy() {
    }

    setConnectionManager(connectionManager: ISignalRConnectionManager): SignalROPOSService {
        if (connectionManager == undefined) {
            const errorMessage: string = 'ERROR -> connectionManager parameter cannot be null';
            this._logHelper.trace(errorMessage);
            throw new Error(errorMessage);
        }
        this._connectionManager = connectionManager;
        return this;
    }

    init(): SignalROPOSService {
        // Creamos el proxy
        this._hubProxy = this._connectionManager.createHubProxy('oposHub');
        this._hubProxy.on('OnOPOS_ConnectionStateChanged', (param: boolean) => this.setConnectionStateChange(param));
        return this;
    }

    setConnectionStateChange(param: boolean) {
        this._onConnectionStateChanged.next(param);
        this.setStatusConnection(param);
    }

    onConnectionStatusChanged(): Observable<boolean> {
        return this._onConnectionStateChanged.asObservable();
      }

    // SetStatusConnection
    setStatusConnection(status: boolean) {
        this._statusConnection = status;
    }

    // GetStatusConnection
    getStatusConnection(): boolean {
        return this._statusConnection;
    }

    // Init Diplay
    startInitiOPOSDisplayProcess(): Promise<OPOSDisplayApplicationInitResponse> {
        return this._hubProxy.invoke('OPOSDisplayApplicationInit');
    }

    // Init CashDrawer
    startInitiOPOSCashDrawerProcess(): Promise<OPOSCashDrawerApplicationInitResponse> {
        return this._hubProxy.invoke('OPOSOCashDrawerApplicationInit');
    }

    // Método para la escritura en el Visor
    OPOSWriteDisplay(strLinea1: string, strLinea2: string): Promise<OPOSWriteDisplayResponse> {
        return this._hubProxy.invoke('OPOSWriteDisplay', strLinea1, strLinea2);
    }

    // Método para el borrado del texto del visor
    OPOSClearLineDisplay(): Promise<OPOSClearLineDisplayResponse> {
        return this._hubProxy.invoke('OPOSClearLineDisplay');
    }

    // Método para la apertura del cajón
    OPOSOpenCashDrawer(): Promise<OPOSOpenCashDrawerResponse> {
        return this._hubProxy.invoke('OPOSOpenCashDrawer');
    }
}
