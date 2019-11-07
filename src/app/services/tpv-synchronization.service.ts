// import { Injectable } from '@angular/core';
// import { Observable } from 'rxjs/Observable';
// import { Subject } from 'rxjs/Subject';
// // import { SignalRConnectionManagerService } from 'app/services/signalr/signalr-connection-manager';
// import { SignalRPOSService } from 'app/services/signalr/signalr-pos.service';
// /*
// import { SignalRTMEService } from 'app/services/signalr/signalr-tme.service';
// import { SignalRPSSService } from 'app/services/signalr/signalr-pss.service';
// */
// import { ISignalRConnectionManager } from 'app/shared/isignalr-conection-manager';
// import { LogHelper } from 'app/helpers/log-helper';
// import { MinimumNeededConfiguration } from 'app/config/minimum-needed.config';
// import { AppDataConfiguration } from 'app/config/app-data.config';
// import { DBSyncTableDownloadStartedArgs } from 'app/shared/signalr-server-responses/pos-hub/dbsync-table-download-started-args';
// import { DBSyncProgressChangedArgs } from 'app/shared/signalr-server-responses/pos-hub/dbsync-progress-changed-args';
// import { DBSyncFinishedArgs } from 'app/shared/signalr-server-responses/pos-hub/dbsync-finished-args';
// import { AlertsService } from 'app/services/alerts/alerts.service';
// import { AlertPurposeType } from 'app/shared/alerts/alert-purpose-type.enum';
// import { AlertsInternalService } from 'app/services/alerts/alerts-internal.service';
// // import { SignalrUpdater } from './signalr/signalr-updater';
// // import { SignalrUpdaterConnectionManager } from './signalr/signalr-updater-connection-manager';
// import { POSApplicationSyncResponse } from 'app/shared/hubble-pos-signalr-responses/pos-application-sync-response';
// import { POSApplicationSyncResponseStatuses } from 'app/shared/hubble-pos-signalr-responses/pos-application-sync-response-statuses.enum';

// @Injectable()
// export class TPVInitializationService {

//   //#region private members
//   private _signalRConnectionManager: ISignalRConnectionManager;
//   // private _initializationFinished: Subject<boolean> = new Subject();
//   private _dbSyncTableDownloadStarted: Subject<DBSyncTableDownloadStartedArgs> = new Subject();
//   private _dbSyncProgressChanged: Subject<DBSyncProgressChangedArgs> = new Subject();
//   private _dbSyncFinished: Subject<DBSyncFinishedArgs> = new Subject();
//   //#endregion private members

//   //#region constructor
//   constructor(
//     // signalRConnectionManagerService: SignalRConnectionManagerService,
//     private _signalRPOSService: SignalRPOSService,
//     /*private _signalRTMEService: SignalRTMEService,
//     signalRPSSService: SignalRPSSService,*/
//     private _minimumDataConfig: MinimumNeededConfiguration,
//     private _appDataConfig: AppDataConfiguration,
//     private _alertService: AlertsService,
//     private _alertInternalService: AlertsInternalService,
//     /*
//     private signalRUpdater: SignalrUpdater,
//     private _signalRUpdateConnectionManager: SignalrUpdaterConnectionManager*/
//   ) {
// /*
//     this._signalRConnectionManager = signalRConnectionManagerService;

//     // Inicializamos el servicio proxy para la comunicación con el hub POS, que es el que necesitamos para inicializar la app
//     this._signalRPOSService
//       .setConnectionManager(this._signalRConnectionManager)
//       .init();
//       */
//     // Nos suscribimos a los eventos de sincronización para lanzarlos hacia afuera
//     this._signalRPOSService.dbSyncTableDownloadStarted().subscribe(
//       (args: DBSyncTableDownloadStartedArgs) => this._onDBSyncTableDownloadStarted(args));
//     this._signalRPOSService.dbSyncProgressChanged().subscribe(
//       (args: DBSyncProgressChangedArgs) => this._onDBSyncProgressChanged(args));
//     this._signalRPOSService.dbSyncFinished().subscribe(
//       (args: DBSyncFinishedArgs) => this._onDBSyncFinished(args));

//       /*
//     // Inicializamos el servicio proxy con el hub TME
//     this._signalRTMEService
//       .setConnectionManager(this._signalRConnectionManager)
//       .init();
//     // Inicializamos el servicio proxy para la comunicación con el hub PSS. Dependiendo del tipo de negocio solicitaremos que arranque o no.
//     signalRPSSService
//       .setConnectionManager(this._signalRConnectionManager)
//       .init();
//       */
//   }
//   //#endregion constructor

//   // private _event: Subject<boolean> = new Subject();
//   //#region public methods
//   /**
//    * Inicializa todos los componentes necesarios para la ejecución del TPV.
//    * Solicita la inicialización del POSHub, que se encarga de analizar el esquema de base de datos, replicar y sincronizar.
//    *
//    * @returns {Observable<boolean>}
//    * @memberof TPVInitializationService
//    */

//   async synchronizationAsync(): Promise<boolean> {
//     let successful: boolean = false;
//     if ((await this._minimumDataConfig.fillIdentityAsync()) === true &&
//       (await this._appDataConfig.fillIdentityAsync()) === true) { // Recuperar el identity necesario ok.
//       successful = true;
//     } else { // Recuperar el identity necesario KO.
//       this._logHelper.trace('ERROR-> No se ha podido recuperar el identity del fichero json necesario para arrancar el TPV');
//     }
//     // inicia conexion signalR actualizador
//     // Inicamos la conexión con el servidor SignalR
//     const startConnectionResponse = await this._signalRConnectionManager.startConnection();
//     this._logHelper.trace(startConnectionResponse);
//     /*
//     try {
      
//       if ((await this._signalRUpdateConnectionManager.startConnection()) == 1) {
//         this.signalRUpdater.notifyStarting();
//       }
//     } catch (ex) {
//       this._logHelper.logError('Imposible connect to updater Service');
//     }
//     */
//     if (startConnectionResponse.state === 1) { // Conexión con el servidor SignalR OK.
//       // Solicitamos inicialiazión del POSHub
//       const posServiceInitializationResponse: POSApplicationSyncResponse =
//         await this._signalRPOSService.startSyncProcess(this._appDataConfig.userConfiguration.Identity);
//       if (posServiceInitializationResponse.status === POSApplicationSyncResponseStatuses.successful) {
//         // Esquema, réplica y sincronización ok
//         // TODO: SI FALLA LA REPLICA DEBE CONTINUAR
//         this._appDataConfig.userConfiguration.PosId = posServiceInitializationResponse.posId;
//         this._alertService.getActiveAlerts(AlertPurposeType.showOnInit)
//           .first().subscribe(alerts => {
//             // this._logHelper.trace(JSON.stringify(alerts));
//             this._alertInternalService.showAvailableAlerts(alerts)
//               .first().subscribe();
//           });
//       } else { // Esquema, réplica o sincronización ko
//         const errorMessage: string =
//           `No se ha podido realizar la sincronización de datos necesaria para arrancar el TPV. POSApplicationStartingResponse.status:
//             ${posServiceInitializationResponse.status}, POSApplicationStartingResponse.message:
//             ${posServiceInitializationResponse.message}`;
//         this._logHelper.logError(posServiceInitializationResponse.status, errorMessage);
//       }
//     } else { // Conexión con el servidor SignalR KO.
//       const errorMessage: string =
//         `No ha sido posible conectar al servidor SignalR. Connection.start() state: ${startConnectionResponse.state}`;
//       this._logHelper.logError(startConnectionResponse.state, errorMessage);
//     }
//     return successful;
//   }

//   dbSyncTableDownloadStarted(): Observable<DBSyncTableDownloadStartedArgs> {
//     return this._dbSyncTableDownloadStarted.asObservable();
//   }

//   dbSyncProgressChanged(): Observable<DBSyncProgressChangedArgs> {
//     return this._dbSyncProgressChanged.asObservable();
//   }

//   dbSyncFinished(): Observable<DBSyncFinishedArgs> {
//     return this._dbSyncFinished.asObservable();
//   }
//   //#endregion public methods

//   //#region event handlers
//   private _onDBSyncTableDownloadStarted(args: DBSyncTableDownloadStartedArgs) {
//     this._dbSyncTableDownloadStarted.next(args);
//   }

//   private _onDBSyncProgressChanged(args: DBSyncProgressChangedArgs) {
//     this._dbSyncProgressChanged.next(args);
//   }

//   private _onDBSyncFinished(args: DBSyncFinishedArgs) {
//     return this._dbSyncFinished.next(args);
//   }
//   //#endregion event handlers
// }
