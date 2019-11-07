import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { Subject } from 'rxjs/Subject';
import { SignalRConnectionManagerService } from 'app/services/signalr/signalr-connection-manager';
import { SignalRPOSService } from 'app/services/signalr/signalr-pos.service';
// import { SignalRPrintingService } from 'app/services/signalr/signalr-printing.service';
import { SignalRPaymentTerminalService } from 'app/services/signalr/signalr-payment-terminal.service';
import { SignalRPSSService } from 'app/services/signalr/signalr-pss.service';
import { ISignalRConnectionManager } from 'app/shared/isignalr-conection-manager';
import { LogHelper } from 'app/helpers/log-helper';
import { POSApplicationStartingResponse } from 'app/shared/hubble-pos-signalr-responses/pos-application-starting-response';
import {
  POSApplicationStartingResponseStatuses
} from 'app/shared/hubble-pos-signalr-responses/pos-application-starting-response-statuses.enum';
import { MinimumNeededConfiguration } from 'app/config/minimum-needed.config';
import { AppDataConfiguration } from 'app/config/app-data.config';
import { DBSyncTableDownloadStartedArgs } from 'app/shared/signalr-server-responses/pos-hub/dbsync-table-download-started-args';
import { DBSyncProgressChangedArgs } from 'app/shared/signalr-server-responses/pos-hub/dbsync-progress-changed-args';
import { DBSyncFinishedArgs } from 'app/shared/signalr-server-responses/pos-hub/dbsync-finished-args';
import { AlertsService } from 'app/services/alerts/alerts.service';
import { AlertPurposeType } from 'app/shared/alerts/alert-purpose-type.enum';
import { AlertsInternalService } from 'app/services/alerts/alerts-internal.service';
import { SignalrUpdater } from './signalr/signalr-updater';
import { SignalrUpdaterConnectionManager } from './signalr/signalr-updater-connection-manager';

import {
  SetPrintingTemplatesAndSettingsResponse
} from 'app/shared/signalr-server-responses/printingModuleHub/set-printing-templates-and-settings-response';
import {
  SetPrintingTemplatesAndSettingsResponseStatuses
} from 'app/shared/signalr-server-responses/printingModuleHub/set-printing-templates-and-settings-response-statuses.enum';
import { SignalRTMEService } from './signalr/signalr-tme.service';
import { TMEApplicationSyncResponse } from 'app/shared/hubble-pos-signalr-responses/tme-application-sync-response';
import { TMEApplicationSyncResponseStatuses } from 'app/shared/hubble-pos-signalr-responses/tme-application-sync-response-statuses.enum';
import { SignalROPOSService } from './signalr/signalr-opos.service';
import { SignalRMultiTPVConnectionManagerService } from './signalr/signalr-multitpv-connection-manager';
import { SignalRMultiTPVService } from './signalr/signalr-multitpv.service';
import { ISignalRMultiTPVConnectionManager } from 'app/shared/isignalr-multitpv-conection-manager';
import { MultitpvFuellingPointsService } from 'app/services/multitpv/multitpv-fuelling-points.service';
import { POSApplicationSyncResponse } from 'app/shared/hubble-pos-signalr-responses/pos-application-sync-response';
import { POSApplicationSyncResponseStatuses } from 'app/shared/hubble-pos-signalr-responses/pos-application-sync-response-statuses.enum';

import { ElectronicJournalService } from 'app/services/electronic-journal/electronic-journal.service';
import { SignalRTMEConnectionManagerService } from './signalr/signalr-tme-connection-manager';
// import { SignalRPSSConnectionManagerService } from './signalr/signalr-pss-connection-manager';
import { PrintingService } from './printing/printing.service';

@Injectable()
export class TPVInitializationService {

  //#region private members
  private _signalRConnectionManager: ISignalRConnectionManager;
  private _signalRMultiTPVConnectionManager: ISignalRMultiTPVConnectionManager;
  private _signalRTMEConnectionManager: ISignalRConnectionManager;
  // private _signalRPSSConnectionManager: ISignalRConnectionManager;
  // private _initializationFinished: Subject<boolean> = new Subject();
  private _dbSyncTableDownloadStarted: Subject<DBSyncTableDownloadStartedArgs> = new Subject();
  private _dbSyncProgressChanged: Subject<DBSyncProgressChangedArgs> = new Subject();
  private _dbSyncFinished: Subject<DBSyncFinishedArgs> = new Subject();
  //#endregion private members

  //#region constructor
  constructor(
    signalRConnectionManagerService: SignalRConnectionManagerService,
    private _signalRPOSService: SignalRPOSService,
    signalRPSSService: SignalRPSSService,
    // private _signalRPrintingService: SignalRPrintingService,
    private _printingService: PrintingService,
    private _signalRTMEService: SignalRTMEService,
    private _signalROPOSService: SignalROPOSService,
    signalRPaymentTerminalService: SignalRPaymentTerminalService,
    private _minimumDataConfig: MinimumNeededConfiguration,
    private _appDataConfig: AppDataConfiguration,
    private _alertService: AlertsService,
    private _alertInternalService: AlertsInternalService,
    private signalRUpdater: SignalrUpdater,
    private _signalRUpdateConnectionManager: SignalrUpdaterConnectionManager,
    signalRMultiTpvConnectionManager: SignalRMultiTPVConnectionManagerService,
    private _signalRMultiTPVService: SignalRMultiTPVService,
    private _svcMultiTPVFp: MultitpvFuellingPointsService,
    private _electronicJournal: ElectronicJournalService,
    signalRTMEConnectionManagerService: SignalRTMEConnectionManagerService,
    // signalRPSSConnectionManagerService: SignalRPSSConnectionManagerService,
    private _logHelper : LogHelper,
  ) {
    this._signalRConnectionManager = signalRConnectionManagerService;
    this._signalRMultiTPVConnectionManager = signalRMultiTpvConnectionManager;
    this._signalRTMEConnectionManager = signalRTMEConnectionManagerService;
    // this._signalRPSSConnectionManager = signalRPSSConnectionManagerService;

    // Inicializamos el servicio proxy para la comunicación con el hub POS, que es el que necesitamos para inicializar la app
    this._signalRPOSService
      .setConnectionManager(this._signalRConnectionManager)
      .init();
    // Nos suscribimos a los eventos de sincronización para lanzarlos hacia afuera
    this._signalRPOSService.dbSyncTableDownloadStarted().subscribe(
      (args: DBSyncTableDownloadStartedArgs) => this._onDBSyncTableDownloadStarted(args));
    this._signalRPOSService.dbSyncProgressChanged().subscribe(
      (args: DBSyncProgressChangedArgs) => this._onDBSyncProgressChanged(args));
    this._signalRPOSService.dbSyncFinished().subscribe(
      (args: DBSyncFinishedArgs) => this._onDBSyncFinished(args));

    // Inicializamos el servicio proxy para la comunicación con el hub PSS. Dependiendo del tipo de negocio solicitaremos que arranque o no.
    signalRPSSService
      .setConnectionManager(this._signalRConnectionManager)
      .init();
    // Inicializamos el servicio proxy para la comunicación con el hub de impresión.
    // _signalRPrintingService
    //   .setConnectionManager(this._signalRConnectionManager)
    //   .init();
    signalRPaymentTerminalService
      .setConnectionManager(this._signalRConnectionManager)
      .init();
    this.signalRUpdater.setConnectionManager(this._signalRUpdateConnectionManager)
      .init();

    // Inicializamos el servicio proxy para la comunicación con el hub de tme.
    _signalRTMEService
      .setConnectionManager(this._signalRTMEConnectionManager)
      .init();

    // Inicializamos el servicio proxy para la comunicación con el hub de opos.
    this._signalROPOSService
      .setConnectionManager(this._signalRConnectionManager)
      .init();
  }
  //#endregion constructor

  // private _event: Subject<boolean> = new Subject();
  //#region public methods
  /**
   * Inicializa todos los componentes necesarios para la ejecución del TPV.
   * Solicita la inicialización del POSHub, que se encarga de analizar el esquema de base de datos, replicar y sincronizar.
   *
   * @returns {Observable<boolean>}
   * @memberof TPVInitializationService
   */
  // initialize(): Observable<boolean> {
  async initializeAsync(): Promise<boolean> {
    let successful: boolean = false;

    // TODO: Por qué se recupera el contenido del fichero dos veces?¿?¿?¿?¿?
    if ((await this._minimumDataConfig.fillIdentityAsync()) === true &&
      (await this._appDataConfig.fillIdentityAsync()) === true) { // Recuperar el identity necesario ok.
      successful = true;
    } else { // Recuperar el identity necesario KO.
      this._logHelper.trace('ERROR-> No se ha podido recuperar el identity del fichero json necesario para arrancar el TPV');
    }

    // inicia conexion signalR actualizador

    // Inicamos la conexión con el servidor SignalR
    const startConnectionResponse = await this._signalRConnectionManager.startConnection();
    this._logHelper.trace(startConnectionResponse);
    const startConnectionTMEResponse = await this._signalRTMEConnectionManager.startConnection();
    this._logHelper.trace(startConnectionTMEResponse);
    try {
      if ((await this._signalRUpdateConnectionManager.startConnection()) == 1) {
        this.signalRUpdater.notifyStarting();
      }
    } catch (ex) {
      this._logHelper.logError('Imposible connect to updater Service');
    }
    if (startConnectionResponse.state === 1) { // Conexión con el servidor SignalR OK.

      // Solicitamos inicialización de Electronic Journal service (Envío de información pendiente de ejecuciones anteriores).
      this._electronicJournal.startJournal()
      .first().subscribe((startJournalSucceed: boolean) => {
        // Este resultado no afecta al resultado final de la ejecución
        if (startJournalSucceed === true) {
          this._logHelper.trace('Configuración inicial de Electronic Journal service OK->');
        } else {
          this._logHelper.trace('Configuración inicial de Electronic Journal service KO->');
        }
      });
      // Solicitamos inicialiazión del POSHub
      const posServiceInitializationResponse: POSApplicationStartingResponse =
        await this._signalRPOSService.startInitializationProcess(this._appDataConfig.userConfiguration.Identity);
      if (posServiceInitializationResponse.status === POSApplicationStartingResponseStatuses.successful) {
        // Esquema, réplica y sincronización ok
        // TODO: SI FALLA LA REPLICA DEBE CONTINUAR
        this._appDataConfig.userConfiguration.PosId = posServiceInitializationResponse.posId;
        if ((await this._minimumDataConfig.fillConfigurationAsync()) === true &&
          (await this._appDataConfig.fillConfigurationAsync()) === true) { // Recuperada toda la configuración necesaria ok.
          // Solicitamos inicialización al hub de impresión.
          try {

            const printingInitialConfigResponse: SetPrintingTemplatesAndSettingsResponse =
            await this._printingService.startInitializationProcess();

          if (printingInitialConfigResponse.status === SetPrintingTemplatesAndSettingsResponseStatuses.successful) {
            this._logHelper.trace(`Configuración inicial de printing service OK-> ${printingInitialConfigResponse.message}`);
            // Todos los pasos han sido satisfactorios
            successful = true;
          } else {
            this._logHelper.trace(`Configuración inicial de printing service KO-> ${printingInitialConfigResponse.message}`);
            successful = false;
          }
        } catch (ex) {
          this._logHelper.logError(ex);
        }

          // Solicitamos inicialización al hub de tme.
          const tmeApplicationSyncResponse: TMEApplicationSyncResponse =
            await this._signalRTMEService.startSyncProcess();
          if (tmeApplicationSyncResponse.status === TMEApplicationSyncResponseStatuses.successful) {
            this._logHelper.trace(`Configuración inicial de tme service OK-> ${tmeApplicationSyncResponse.message}`);
            // Todos los pasos han sido satisfactorios
            successful = true;
          } else {
            this._logHelper.trace(`Configuración inicial de tme service KO-> ${tmeApplicationSyncResponse.message}`);
            successful = false;
          }
        } else { // Recuperada toda la configuración necesaria KO.
          this._logHelper.trace('ERROR-> No se ha podido recuperar toda la configuración necesaria para arrancar el TPV');
        }
        this._alertService.getActiveAlerts(AlertPurposeType.showOnInit)
          .first().subscribe(alerts => {
            // this._logHelper.trace(JSON.stringify(alerts));
            this._alertInternalService.showAvailableAlerts(alerts)
              .first().subscribe();
          });
      } else { // Esquema, réplica o sincronización ko
        const errorMessage: string =
          `No se ha podido realizar la sincronización de datos necesaria para arrancar el TPV. POSApplicationStartingResponse.status:
          ${posServiceInitializationResponse.status}, POSApplicationStartingResponse.message:
          ${posServiceInitializationResponse.message}`;
        this._logHelper.logError(posServiceInitializationResponse.status, errorMessage);
      }
    } else { // Conexión con el servidor SignalR KO.
      const errorMessage: string =
        `No ha sido posible conectar al servidor SignalR. Connection.start() state: ${startConnectionResponse.state}`;
      this._logHelper.logError(startConnectionResponse.state, errorMessage);
    }
    await this._onConnectionMutliTpv();
    return successful;
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

  //#region event handlers
  private _onDBSyncTableDownloadStarted(args: DBSyncTableDownloadStartedArgs) {
    this._dbSyncTableDownloadStarted.next(args);
  }

  private _onDBSyncProgressChanged(args: DBSyncProgressChangedArgs) {
    this._dbSyncProgressChanged.next(args);
  }

  private _onDBSyncFinished(args: DBSyncFinishedArgs) {
    return this._dbSyncFinished.next(args);
  }
  //#endregion event handlers

  //#region ConexionHubRemote

  private async _onConnectionMutliTpv() {
    try {
      const ipCentralMultiTPV: string = (this._appDataConfig.getConfigurationParameterByName('IP_MULTITPV', 'TPV')) ?
                                        this._appDataConfig.getConfigurationParameterByName('IP_MULTITPV', 'TPV').meaningfulStringValue : undefined;
       this._signalRPOSService.startInitialValidatedServicesMultiTPV(ipCentralMultiTPV, this._appDataConfig.isServerMultipleTPV);
      // Inicializamos Manager con Ip Remota/MultiTPV, es la ip que servirá como server para las comunicaciones hub
      this._signalRMultiTPVConnectionManager.onInit(ipCentralMultiTPV);
      // Inicializamos el servicio proxy para la comunicación con el hub de multiTpv.
      this._signalRMultiTPVService
      .setConnectionManager(this._signalRMultiTPVConnectionManager)
      .init();

      // Inicializando el MutltiTPV Hub
      const startConnectionMultiTPVResponse = await this._signalRMultiTPVConnectionManager.startConnection();
      if ( startConnectionMultiTPVResponse.state != 1) {
          const errorMessage: string = 'No ha sido posible conectar al servidor SignalRMultiTPV. Connection.start()';
          this._logHelper.logError(startConnectionMultiTPVResponse.state, errorMessage);
      } else {
          if ( startConnectionMultiTPVResponse.state == 1 ) {
            if (!this._appDataConfig.isServerMultipleTPV) {
              this._getModeOperationTPVCentral();
              this._getOperatorTPVCentral();
              this._getDocumentVirtualDomsTPVCentral();
            } else {
              this._signalRMultiTPVService.requestNotifyGenericChangesRed('resetServerTPVCtrlF5').subscribe();
            }
          }
      }
    } catch (error) {
      this._logHelper.logError(undefined, 'Error al iniciar _onConnectionMutliTpv : -> ' + error);
    }
  }

  private _getModeOperationTPVCentral() {
    this._signalRMultiTPVService.requestServiceModeInitialMultiTPVHead()
    .first()
    .subscribe(
      response => {
          if (response) {
            if (response.status == 1 ) {
                // enviar a grabar a la base local, consumir el web service cofo
                // response.fplist
                this._svcMultiTPVFp.InitOperationModeFuellingPoint(response.fpList)
                .first()
                .subscribe(
                  response => {
                    this._logHelper.trace('_getModeOperationTPVCentral',response);
                  },
                  error => {
                    this._logHelper.logError(undefined,error);
                   }
                );
            }
          } else {
            this._logHelper.logError(response.status, response.message);
          }
      },
      error => {
        this._logHelper.logError(undefined,error);
      }
    );

  }

  private _getOperatorTPVCentral() {
    this._signalRMultiTPVService.requestOperatorInitialMultiTPVHead()
    .first()
    .subscribe(
      response => {
          if (response) {
            if (response.status == 1 ) {
                this._signalRMultiTPVService.fnInitialOperatorTpv(response.operatorTpvList);
            }
          } else {
            this._logHelper.logError(response.status, response.message);
          }
      },
      error => {
        this._logHelper.logError(undefined,error);
      }
    );

  }

  private _getDocumentVirtualDomsTPVCentral() {
    this._signalRMultiTPVService.requestDocumentVirtualInitialMultiTPV()
    .first()
    .subscribe(
      response => {
          if (response) {
            if (response.status == 1 ) {
                this._svcMultiTPVFp.InitDocumentVirtualDoms(response.docVirtualList)
                .first()
                .subscribe(
                  response1 => {
                    this._logHelper.trace('_getDocumentVirtualDomsTPVCentral', response1);
                  },
                  error => {this._logHelper.logError(undefined,error); }
                );
            }
          } else {
            this._logHelper.logError(response.status, response.message);
          }
      },
      error => {this._logHelper.logError(undefined, error ); }
    );

  }
  //#endregion

  // async synchronizationAsync(): Promise<boolean> {
  //   let successful: boolean = false;
  //   if ((await this._minimumDataConfig.fillIdentityAsync()) === true &&
  //     (await this._appDataConfig.fillIdentityAsync()) === true) { // Recuperar el identity necesario ok.
  //     successful = true;
  //   } else { // Recuperar el identity necesario KO.
  //     this._logHelper.trace('ERROR-> No se ha podido recuperar el identity del fichero json necesario para arrancar el TPV');
  //   }
  //   // inicia conexion signalR actualizador
  //   // Inicamos la conexión con el servidor SignalR
  //   const startConnectionResponse = await this._signalRConnectionManager.startConnection();
  //   this._logHelper.trace(startConnectionResponse);
  //   /*
  //   try {
      
  //     if ((await this._signalRUpdateConnectionManager.startConnection()) == 1) {
  //       this.signalRUpdater.notifyStarting();
  //     }
  //   } catch (ex) {
  //     this._logHelper.logError('Imposible connect to updater Service');
  //   }
  //   */
  //   if (startConnectionResponse.state === 1) { // Conexión con el servidor SignalR OK.
  //     // Solicitamos inicialiazión del POSHub
  //     const posServiceInitializationResponse: POSApplicationSyncResponse =
  //       await this._signalRPOSService.startSyncProcess(this._appDataConfig.userConfiguration.Identity);
  //     if (posServiceInitializationResponse.status === POSApplicationSyncResponseStatuses.successful) {
  //       // Esquema, réplica y sincronización ok
  //       // TODO: SI FALLA LA REPLICA DEBE CONTINUAR
  //       this._appDataConfig.userConfiguration.PosId = posServiceInitializationResponse.posId;
  //       this._alertService.getActiveAlerts(AlertPurposeType.showOnInit)
  //         .first().subscribe(alerts => {
  //           // this._logHelper.trace(JSON.stringify(alerts));
  //           this._alertInternalService.showAvailableAlerts(alerts)
  //             .first().subscribe();
  //         });
  //     } else { // Esquema, réplica o sincronización ko
  //       const errorMessage: string =
  //         `No se ha podido realizar la sincronización de datos necesaria para arrancar el TPV. POSApplicationStartingResponse.status:
  //           ${posServiceInitializationResponse.status}, POSApplicationStartingResponse.message:
  //           ${posServiceInitializationResponse.message}`;
  //       this._logHelper.logError(posServiceInitializationResponse.status, errorMessage);
  //     }
  //   } else { // Conexión con el servidor SignalR KO.
  //     const errorMessage: string =
  //       `No ha sido posible conectar al servidor SignalR. Connection.start() state: ${startConnectionResponse.state}`;
  //     this._logHelper.logError(startConnectionResponse.state, errorMessage);
  //   }
  //   return successful;
  // }


  async synchronizationAsync(): Promise<boolean> {
    let successful: boolean = false;
    /*
    if ((await this._minimumDataConfig.fillIdentityAsync()) === true &&
      (await this._appDataConfig.fillIdentityAsync()) === true) { // Recuperar el identity necesario ok.
      successful = true;
    } else { // Recuperar el identity necesario KO.
      this._logHelper.trace('ERROR-> No se ha podido recuperar el identity del fichero json necesario para arrancar el TPV');
    }
    */

    try {
        this.signalRUpdater.notifyStarting();
    } catch (ex) {
      this._logHelper.logError('Imposible connect to updater Service');
    }
    // if (startConnectionResponse.state === 1) { // Conexión con el servidor SignalR OK.
      // Solicitamos inicialiazión del POSHub
      const posServiceInitializationResponse: POSApplicationSyncResponse =
        await this._signalRPOSService.startSyncProcess(this._appDataConfig.userConfiguration.Identity);
      if (posServiceInitializationResponse.status === POSApplicationSyncResponseStatuses.successful) {
        // Esquema, réplica y sincronización ok
        // TODO: SI FALLA LA REPLICA DEBE CONTINUAR
        successful = true;
        this._appDataConfig.userConfiguration.PosId = posServiceInitializationResponse.posId;
        this._alertService.getActiveAlerts(AlertPurposeType.showOnInit)
          .first().subscribe(alerts => {
            // this._logHelper.trace(JSON.stringify(alerts));
            this._alertInternalService.showAvailableAlerts(alerts)
              .first().subscribe();
          });
      } else { // Esquema, réplica o sincronización ko
        const errorMessage: string =
          `No se ha podido realizar la sincronización de datos necesaria para arrancar el TPV. POSApplicationStartingResponse.status:
            ${posServiceInitializationResponse.status}, POSApplicationStartingResponse.message:
            ${posServiceInitializationResponse.message}`;
        this._logHelper.logError(posServiceInitializationResponse.status, errorMessage);
      }
    // } else { // Conexión con el servidor SignalR KO.
    //   const errorMessage: string =
    //     `No ha sido posible conectar al servidor SignalR. Connection.start() state: ${startConnectionResponse.state}`;
    //   this._logHelper.logError(startConnectionResponse.state, errorMessage);
    // }
    return successful;
  }

}
