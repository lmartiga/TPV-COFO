import { Injectable } from '@angular/core';
import { Subject } from 'rxjs/Subject';
import { Observable } from 'rxjs/Observable';
import { HttpService } from 'app/services/http/http.service';
import { AppDataConfiguration } from 'app/config/app-data.config';
import { ConnectionStatus } from 'app/shared/connection-status.enum';
import { TestConnectivityResponse } from 'app/shared/web-api-responses/test-connectivity-response';
import { TestConnectivityResponseStatuses } from 'app/shared/web-api-responses/test-connectivity-response-statuses.enum';
import { LogHelper } from 'app/helpers/log-helper';
/* import { Subscription } from 'rxjs/Subscription'; */

@Injectable()
export class TpvStatusCheckerService {
  // Informa del estado de la conexión de red
  public _networkConnectionStatus: Subject<ConnectionStatus> = new Subject();
  // Informa del estado de la conexión al servicio
  private _serviceConnectionStatus: Subject<ConnectionStatus> = new Subject();

 /*  public loquesea = this._networkConnectionStatus.asObservable(); */

  private _isCheckNetworkConnectionBeingPerformed: boolean = false;
  tipoConectado: boolean = false;

  private _timer: NodeJS.Timer;
  constructor(
    private _appDataConfig: AppDataConfiguration,
    private _http: HttpService,
    private _logHelper: LogHelper,
  ) {
    // Intervalo de peticiones para comprobar la conexión a la red y primera comprobacion
    this.startCheckingNetworkConnection();

  }
  startCheckingNetworkConnection() {
    this._timer = setInterval(() => this._checkNetworkConnection(), this._appDataConfig.networkConnectionRefreshFrecuency);
  }
  stopCheckingNetworkConnection() {
    if (this._timer == undefined) {
      return;
    }
    clearInterval(this._timer);
    this._timer = undefined;
  }
  networkConnectionStatusChanged(): Observable<ConnectionStatus> {
    return this._networkConnectionStatus.asObservable();
  }

  serviceConnectionStatusChanged(): Observable<ConnectionStatus> {
    return this._serviceConnectionStatus.asObservable();
  }

  // publica evento para quien se suscriba sepa el estado de la conexión de red
  private setNetworkConnectionStatus(networkConnectionStatus: ConnectionStatus) {
    if ( networkConnectionStatus == ConnectionStatus.disconnected) {
      this.tipoConectado = false;
    } else {
      this.tipoConectado = true;
    }
    this._networkConnectionStatus.next(networkConnectionStatus);
  }

  // publica evento para quien se suscriba sepa el estado de la conexión al servicio
  private setServiceConnectionStatus(serviceConnectionStatus: ConnectionStatus) {
    this._serviceConnectionStatus.next(serviceConnectionStatus);
  }

  public _checkNetworkConnection() {
    if (this._isCheckNetworkConnectionBeingPerformed === false) {
      this._isCheckNetworkConnectionBeingPerformed = true;
    this._connectToServiceToCheckConnectivity()
      .first()
      .subscribe(
        (response: TestConnectivityResponse) => {
          this._isCheckNetworkConnectionBeingPerformed = false;
          if (response.status == TestConnectivityResponseStatuses.successful) {
            this.setNetworkConnectionStatus(ConnectionStatus.connected);
            this.setServiceConnectionStatus(ConnectionStatus.connected);
          } else {
            this.setNetworkConnectionStatus(ConnectionStatus.disconnected);
            this.setServiceConnectionStatus(ConnectionStatus.connected);
            this._logHelper.logError(response.status, response.message);
          }
        },
        err => {
          this._isCheckNetworkConnectionBeingPerformed = false;
          this.setNetworkConnectionStatus(ConnectionStatus.unknown);
          this.setServiceConnectionStatus(ConnectionStatus.disconnected);
        });
    } else {
        this._logHelper.trace('Se ha inhibido una solicitud a TestConnectivity, porque ya se está esperando una respuesta del servicio');
    }
  }

  private _connectToServiceToCheckConnectivity(): Observable<any> {
    const request = { identity: this._appDataConfig.userConfiguration.Identity };
    return this._http.postJsonObservable(`${this._appDataConfig.apiUrl}/TestConnectivity`, request);
  }
}
