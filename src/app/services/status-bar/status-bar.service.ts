import { Injectable, OnDestroy } from '@angular/core';
import { Observable } from 'rxjs/observable';
import { Subject } from 'rxjs/Subject';
import { FuellingPointsSignalrUpdatesService } from 'app/services/fuelling-points/fuelling-points-signalr-updates.service';
import { ConnectionStatus } from 'app/shared/connection-status.enum';
import { Subscription } from 'rxjs/Subscription';
import { ConnectionStateType } from 'app/shared/fuelling-point/signalR-Response/connection-state-type.enum';
import { SignalRPOSService } from 'app/services/signalr/signalr-pos.service';
import { MultitpvFuellingPointsService } from 'app/services/multitpv/multitpv-fuelling-points.service';

@Injectable()
export class StatusBarService implements OnDestroy {
    private _subscriptions: Subscription[] = [];

    // mensaje a mostrar en el status bar
    private message: Subject<string> = new Subject();
    private factura: Subject<boolean> = new Subject();
    private emitirFactura: Boolean = false;
    private _domsConectionChange = new Subject<ConnectionStatus>();
    private _dbConnectionChange = new Subject<ConnectionStatus>();
    private _progressStatusBar = new Subject<number>();
    private _multiTPVConectionChange: Subject<ConnectionStatus> = new Subject<ConnectionStatus>();
    multiTPVConectionChange$ = this._multiTPVConectionChange.asObservable();
    private _reconnectServiceHub = new Subject<boolean>();
    reconnectServiceHub$ = this._reconnectServiceHub.asObservable();

    private _multiTPVConnectionStatus: ConnectionStatus = ConnectionStatus.unknown;
    constructor(
        private _fpSingalRUpdatesSvc: FuellingPointsSignalrUpdatesService,
        private _posSingalRSvc: SignalRPOSService,
        private _svcMultiTPVFp: MultitpvFuellingPointsService,
    ) {
        this._subscriptions.push(this._fpSingalRUpdatesSvc.onConnectionStateChange()
            .subscribe(response => {
                switch (response.actualState) {
                    case ConnectionStateType.Connected:
                        this._domsConectionChange.next(ConnectionStatus.connected);
                        break;
                    case ConnectionStateType.Disconnected:
                        this._domsConectionChange.next(ConnectionStatus.disconnected);
                        break;
                    default:
                        this._domsConectionChange.next(ConnectionStatus.unknown);
                }
            }));
        this._subscriptions.push(this._posSingalRSvc.dbSyncFinished()
            .subscribe(response => {
                this._dbConnectionChange.next(response.isSuccessful ?
                    ConnectionStatus.connected :
                    ConnectionStatus.disconnected);
            }));
    }
    ngOnDestroy() {
        this._subscriptions.forEach(s => s.unsubscribe());
    }
    messageReceived(): Observable<string> {
        return this.message.asObservable();
    }

    // publish event with the message
    publishMessage(message: string) {
        this.message.next(message);
        setTimeout(() => {
            this.message.next(' ');
        }, 6000);
    }
    publishProgress(percentage: number) {
        this._progressStatusBar.next(percentage);
    }
    resetProgress() {
        this.publishProgress(2.5);
    }
    onDOMSConectionChange(): Observable<ConnectionStatus> {
        return this._domsConectionChange.asObservable();
    }
    onDBConnectionChange(): Observable<ConnectionStatus> {
        return this._dbConnectionChange.asObservable();
    }
    onProgressChange(): Observable<number> {
        return this._progressStatusBar.asObservable();
    }
    setMultiTPVConectionChange(connectStatus: ConnectionStatus) {
        this._multiTPVConnectionStatus = connectStatus;
        this.sendConnectionMultiTpv(connectStatus);
        return this._multiTPVConectionChange.next(connectStatus);
    }
    getMultiTPVConnectionStatus(): ConnectionStatus {
        return this._multiTPVConnectionStatus;
    }
    private sendConnectionMultiTpv(connectStatus: ConnectionStatus) {
        if (connectStatus === ConnectionStatus.connected) {
            this._svcMultiTPVFp.SetMultiTPVConnectSignalR(true).first().subscribe();
        } /*else if (connectStatus === ConnectionStatus.disconnected) {
            this._svcMultiTPVFp.SetMultiTPVConnectSignalR(false).first().subscribe();
        }*/
    }

    onReconnectServiceHub(val: boolean) {
        this._reconnectServiceHub.next(val);
    }

    setEmitirFactura(emitirFactura: Boolean) {
        this.emitirFactura = emitirFactura;
    }
    getEmitirFactura() {
        return this.emitirFactura;
    }
    asignarFactura(bandera: boolean) {
        this.factura.next(bandera);
    }
    obtenerFactura(): Observable<boolean> {
        return this.factura.asObservable();
    }
}
