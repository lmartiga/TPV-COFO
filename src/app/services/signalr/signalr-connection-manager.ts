import { Injectable, OnDestroy } from '@angular/core';
import { environment } from 'environments/environment';
import { ISignalRConnectionManager } from 'app/shared/isignalr-conection-manager';
import { LogHelper } from 'app/helpers/log-helper';
import { StatusBarService } from '../status-bar/status-bar.service';

@Injectable()
export class SignalRConnectionManagerService implements OnDestroy, ISignalRConnectionManager {

  private _connection: SignalR.Hub.Connection;
  private _reconnectionTimeout: NodeJS.Timer;
  private readonly _millisecondsToWaitForReconnection: number = 5000;
  private isErrorInAplication: boolean = false;
  private isReconectingInAplication: boolean = false;

  constructor(
    private  _logHelper: LogHelper,
    private _statusBarService: StatusBarService
  ) {
    this._logHelper.trace('SignalRConnectionManagerService created');
    this._connection = $.hubConnection();
    this._connection.url = `${environment.signalRUrl}/signalr`;

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
    return this._connection.start(() => this._logHelper.trace('SignalR connection started!!'));
  }

  stopConnection(): void {
    this._connection.stop();
  }

  private _onDisconected() {
    this._reconnectionTimeout = setTimeout(() => {
      this.startConnection().then(
        response =>  {
          if (this.isErrorInAplication && this.isReconectingInAplication) {
            this._statusBarService.onReconnectServiceHub(true);
            this.isReconectingInAplication = false;
            this.isErrorInAplication = false;
          }
          this._logHelper.trace('SignalR connection started after disconnected event received');
          this._logHelper.trace(response);
        },
        rejected => this._logHelper.logError(rejected)
      );
    }, this._millisecondsToWaitForReconnection);

    this._logHelper.trace('WARNING -> SignalRConnectionManagerService received disconected status');
  }

  private _onError(error: SignalR.ConnectionError) {
    this.isErrorInAplication = true;
    this._logHelper.trace('SignalR error detected ->');
    this._logHelper.trace(error);
  }

  private _onConnectionStateChanged(change: SignalR.StateChanged) {
    this._logHelper.trace('SignalR connection state changed detected ->');
    this._logHelper.trace(change);
  }

  private _onReconnecting() {
    this.isReconectingInAplication = true;
    this._logHelper.trace('SignalR reconnecting...');
  }

  private _onReconnected() {
    if (this.isErrorInAplication && this.isReconectingInAplication) {
      this._statusBarService.onReconnectServiceHub(true);
      this.isReconectingInAplication = false;
      this.isErrorInAplication = false;
    }
    this._logHelper.trace('SignalR reconnected');
  }
}
