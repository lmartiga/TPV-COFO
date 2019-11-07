import { Injectable, OnDestroy } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { Subject } from 'rxjs/Subject';
import { ISignalRConnectionManager } from 'app/shared/isignalr-conection-manager';
import { DBSyncTableDownloadStartedArgs } from 'app/shared/signalr-server-responses/pos-hub/dbsync-table-download-started-args';
import { DBSyncProgressChangedArgs } from 'app/shared/signalr-server-responses/pos-hub/dbsync-progress-changed-args';
import { DBSyncFinishedArgs } from 'app/shared/signalr-server-responses/pos-hub/dbsync-finished-args';
import { POSApplicationStartingResponse } from 'app/shared/hubble-pos-signalr-responses/pos-application-starting-response';
import { POSApplicationSyncResponse } from 'app/shared/hubble-pos-signalr-responses/pos-application-sync-response';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { LogHelper } from 'app/helpers/log-helper';



@Injectable()
export class SignalRPOSService implements OnDestroy {
  //#region private members
  private _hubProxy: SignalR.Hub.Proxy;
  private _connectionManager: ISignalRConnectionManager;
  private _dbSyncTableDownloadStarted: Subject<DBSyncTableDownloadStartedArgs> = new Subject();
  private _dbSyncProgressChanged: Subject<DBSyncProgressChangedArgs> = new Subject();
  private _dbSyncFinished: BehaviorSubject<DBSyncFinishedArgs>;
  constructor(private  _logHelper: LogHelper) {
    this._dbSyncFinished = new BehaviorSubject<DBSyncFinishedArgs>({
      isSuccessful: true,
      synchronizationProcessName: '',
      errorMessage: ''
    });
  }
  //#endregion private members

  //#region OnDestroy implementation
  ngOnDestroy() {
    // Eliminamos todas las suscripciones
    this._hubProxy.off('DBSyncTableDownloadStarted', _ => this._onServerDBSyncTableDownloadStarted(undefined));
    this._hubProxy.off('DBSyncProgressChanged', _ => this._onServerDBSyncProgressChanged(undefined));
    this._hubProxy.off('DBSyncFinished', _ => this._onServerDBSyncFinished(undefined));
  }
  //#endregion OnDestroy implementation

  //#region public methods
  /**
   *
   *
   * @param {ISignalRConnectionManager} connectionManager
   * @returns {ISignalRHub}
   * @memberof SignalRPOSService
   * @throws {Error} when connectionManager is null
   */
  setConnectionManager(connectionManager: ISignalRConnectionManager): SignalRPOSService {
    if (connectionManager == undefined) {
      const errorMessage: string = 'ERROR -> connectionManager parameter cannot be null';
      this._logHelper.trace(errorMessage);
      throw new Error(errorMessage);
    }
    this._connectionManager = connectionManager;
    return this;
  }

  init(): SignalRPOSService {
    // Creamos el proxy
    this._hubProxy = this._connectionManager.createHubProxy('posHub');

    // Nos suscribimos a las notificaciones no solicitadas del servidor SignalR
    this._hubProxy.on('DBSyncTableDownloadStarted',
      (args: DBSyncTableDownloadStartedArgs) => this._onServerDBSyncTableDownloadStarted(args));
    this._hubProxy.on('DBSyncProgressChanged',
      (args: DBSyncProgressChangedArgs) => this._onServerDBSyncProgressChanged(args));
    this._hubProxy.on('DBSyncFinished',
      (args: DBSyncFinishedArgs) => this._onServerDBSyncFinished(args));
    return this;
  }

  startInitializationProcess(identity: string): Promise<POSApplicationStartingResponse> {
    return this._hubProxy.invoke('POSApplicationStarting', identity);
  }
   // Synchronization
   startSyncProcess(identity: string): Promise<POSApplicationSyncResponse> {
    return this._hubProxy.invoke('POSApplicationSync', identity);
  }

  startInitialValidatedServicesMultiTPV(ipServerSignalr: string, isServerMultipleTPV: boolean): Promise<POSApplicationStartingResponse> {
    return this._hubProxy.invoke('POSMultiTPVInitialValidated', {ipServerSignalr, isServerMultipleTPV});
  }

  dbSyncTableDownloadStarted(): Observable<DBSyncTableDownloadStartedArgs> {
    return this._dbSyncTableDownloadStarted.asObservable();
  }

  dbSyncProgressChanged(): Observable<DBSyncProgressChangedArgs> {
    return this._dbSyncProgressChanged.asObservable();
  }

  dbSyncFinished(): Observable<DBSyncFinishedArgs> {
    return this._dbSyncFinished.asObservable();
  }
  //#endregion public methods

  //#region Event handlers
  private _onServerDBSyncTableDownloadStarted(args: DBSyncTableDownloadStartedArgs) {
    this._logHelper.trace('Recibido evento SignalR DBSyncTableDownloadStarted->');
    this._logHelper.trace(args);
    this._dbSyncTableDownloadStarted.next(args);
  }

  private _onServerDBSyncProgressChanged(args: DBSyncProgressChangedArgs) {
    this._logHelper.trace('Recibido evento SignalR DBSyncProgressChanged->');
    this._logHelper.trace(args);
    this._dbSyncProgressChanged.next(args);
  }

  private _onServerDBSyncFinished(args: DBSyncFinishedArgs) {
    this._logHelper.trace('Recibido evento SignalR DBSyncFinished->');
    this._logHelper.trace(args);
    this._dbSyncFinished.next(args);
  }
  //#endregion Event handlers

  //#region Aux methods
  // private _invokeAsObservable<T>(actionName: string, params?: any): Observable<T> {
  //   this._logHelper.trace(`Se va a llamar al método de SignalR ${actionName} con el siguiente objeto ->`);
  //   this._logHelper.trace(params);
  //   return Observable.create((observer: Subscriber<T>) => {
  //     if (params != undefined) {
  //       this._hubProxy.invoke(actionName, params).then(
  //         (response: T) => observer.next(response),
  //         failResponse => observer.error(failResponse));
  //     } else {
  //       this._hubProxy.invoke(actionName).then(
  //         (response: T) => observer.next(response),
  //         failResponse => observer.error(failResponse));
  //     }
  //   });
  // }
  //#endregion Aux methods
}
