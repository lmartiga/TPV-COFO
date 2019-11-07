import { Injectable, OnDestroy } from '@angular/core';
import { environment } from 'environments/environment';
import { ISignalRConnectionManager } from 'app/shared/isignalr-conection-manager';
import { StatusBarService } from 'app/services/status-bar/status-bar.service';
import { ConnectionStatus } from 'app/shared/connection-status.enum';
import { LogHelper } from 'app/helpers/log-helper';

@Injectable()
export class SignalRMultiTPVConnectionManagerService implements OnDestroy, ISignalRConnectionManager {

  private _connection: SignalR.Hub.Connection;
  private _reconnectionTimeout: NodeJS.Timer;
  //private readonly _millisecondsToWaitForReconnection: number = 5000;
  connectionStatus = ConnectionStatus;

  constructor(private _statusBarService: StatusBarService,private  _logHelper: LogHelper) {
    this._logHelper.trace('SignalRMultiTPVConnectionManagerService created');
  }

  onInit(ipMultiTPV: string): void {
    this._connection = $.hubConnection();
    this._connection.url = `${environment.signalRMultiTPVUrl}/signalr`;
    if (ipMultiTPV) {
      this._connection.url = this._connection.url.replace('localhost', ipMultiTPV);
    }
    this._connection.disconnected(() => this._onDisconected());
    this._connection.error((error: SignalR.ConnectionError) => this._onError(error));
    this._connection.stateChanged((change: SignalR.StateChanged) => this._onConnectionStateChanged(change));
    this._connection.reconnecting(() => this._onReconnecting());
    this._connection.reconnected(() => this._onReconnected());
    this._connection.logging = true;
  }

  ngOnDestroy() {
    this._connection.stop();
    clearTimeout(this._reconnectionTimeout);
  }

  createHubProxy(hubName: string): SignalR.Hub.Proxy {
    return this._connection.createHubProxy(hubName);
  }

  startConnection(): Promise<any> {
    return this._connection.start(() => {
      this._statusBarService.setMultiTPVConectionChange(this.connectionStatus.connected);
    });
  }

  stopConnection(): void {
    this._connection.stop();
  }

  private _onDisconected() {
    this._statusBarService.setMultiTPVConectionChange(this.connectionStatus.disconnected);
    /*
    this._reconnectionTimeout = setTimeout(() => {
      this.startConnection().then(
        response =>  {
          this._statusBarService.setMultiTPVConectionChange(this.connectionStatus.reconnected);
        },
        rejected => this._logHelper.logError(rejected)
      );
    }, this._millisecondsToWaitForReconnection);*/
  }

  private _onError(error: SignalR.ConnectionError) {
    this._statusBarService.setMultiTPVConectionChange(this.connectionStatus.unknown);
  }

  private _onConnectionStateChanged(change: SignalR.StateChanged) {
    // this._logHelper.trace('SignalRMultiTPVConnectionManagerService SignalR connection state changed detected ->', change);
  }

  private _onReconnecting() {
    this._statusBarService.setMultiTPVConectionChange(this.connectionStatus.unknown);
  }

  private _onReconnected() {
    this._statusBarService.setMultiTPVConectionChange(this.connectionStatus.reconnected);
  }
}
