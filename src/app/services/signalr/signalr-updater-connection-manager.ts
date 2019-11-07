import { Injectable, OnDestroy } from '@angular/core';
import { ISignalRConnectionManager } from 'app/shared/isignalr-conection-manager';
import { environment } from 'environments/environment';
import { LogHelper } from 'app/helpers/log-helper';

@Injectable()
export class SignalrUpdaterConnectionManager implements OnDestroy, ISignalRConnectionManager {
    private _connection: SignalR.Hub.Connection;
    private _reconnectionTimeout: NodeJS.Timer;
    private readonly _millisecondsToWaitForReconnection: number = 5000;

    constructor(
        private  _logHelper: LogHelper
    ) {
        this._connection = $.hubConnection();
        this._connection.url = `${environment.signalRUpdateUrl}/signalr`;

        this._connection.disconnected(() => this._onDisconected());
        this._connection.error((error: SignalR.ConnectionError) => this._onError(error));
        this._connection.stateChanged((change: SignalR.StateChanged) => this._onConnectionStateChanged(change));
        this._connection.reconnecting(() => this._onReconnecting());
        this._connection.reconnected(() => this._onReconnected());
    }
    ngOnDestroy() {
        this._connection.stop();
        clearTimeout(this._reconnectionTimeout);
    }
    createHubProxy(hubName: string): SignalR.Hub.Proxy {
        return this._connection.createHubProxy(hubName);
    }
    startConnection(): Promise<any> {
        return this._connection.start(() => this._logHelper.trace('SignalR updater connection started'));
    }
    stopConnection(): void {
        this._connection.stop();
    }
    private _onDisconected() {
        this._reconnectionTimeout = setTimeout(() => {
            this.startConnection().then(
              response =>  {
                this._logHelper.trace('SignalR connection started after disconnected event received');
                this._logHelper.trace(response);
              },
              rejected => this._logHelper.logError(rejected)
            );
          }, this._millisecondsToWaitForReconnection);
        this._logHelper.trace('WARNING -> SignalR Updater Connection manager received disconected status');
    }

    private _onError(error: SignalR.ConnectionError) {
        this._logHelper.trace('SignalR updater connection manager error detected ->');
        this._logHelper.trace(error);
    }

    private _onConnectionStateChanged(change: SignalR.StateChanged) {
        this._logHelper.trace('SignalR updater connection state changed detected ->');
        this._logHelper.trace(change);
    }

    private _onReconnecting() {
        this._logHelper.trace('SignalR reconnecting...');
    }

    private _onReconnected() {
        this._logHelper.trace('SignalR reconnected');
    }
}
