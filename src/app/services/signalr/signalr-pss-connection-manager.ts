import { Injectable, OnDestroy } from '@angular/core';
import { environment } from 'environments/environment';
import { ISignalRConnectionManager } from 'app/shared/isignalr-conection-manager';

@Injectable()
export class SignalRPSSConnectionManagerService implements OnDestroy, ISignalRConnectionManager {

  private _connection: SignalR.Hub.Connection;
  private _reconnectionTimeout: NodeJS.Timer;
  private readonly _millisecondsToWaitForReconnection: number = 5000;

  constructor(
  ) {
    console.log('SignalRPSSConnectionManagerService created');
    this._connection = $.hubConnection();
    this._connection.url = `${environment.signalRPSSUrl}/signalr`;

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
    return this._connection.start(() => console.log('SignalRPSS connection started!!'));
  }

  stopConnection(): void {
    this._connection.stop();
  }

  private _onDisconected() {
    this._reconnectionTimeout = setTimeout(() => {
      this.startConnection().then(
        response =>  {
          console.log('SignalRPSS connection started after disconnected event received');
          console.log(response);
        },
        rejected => console.error(rejected)
      );
    }, this._millisecondsToWaitForReconnection);

    console.log('WARNING -> SignalRPSSConnectionManagerService received disconected status');
  }

  private _onError(error: SignalR.ConnectionError) {
    console.log('SignalRPSS error detected ->');
    console.log(error);
  }

  private _onConnectionStateChanged(change: SignalR.StateChanged) {
    console.log('SignalRPSS connection state changed detected ->');
    console.log(change);
  }

  private _onReconnecting() {
    console.log('SignalRPSS reconnecting...');
  }

  private _onReconnected() {
    console.log('SignalRPSS reconnected');
  }
}
