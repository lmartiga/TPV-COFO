import { Component, OnInit, OnDestroy, HostBinding, Output, EventEmitter, HostListener } from '@angular/core';
import { TooltipPosition } from '@angular/material';
import { StatusBarService } from 'app/services/status-bar/status-bar.service';
import { AppDataConfiguration } from 'app/config/app-data.config';
import { TpvStatusCheckerService } from 'app/services/tpv-status-checker.service';
import { ConnectionStatus } from 'app/shared/connection-status.enum';
import { Subscription } from 'rxjs/Subscription';
// import { TPVInitializationService } from 'app/services/tpv-synchronization.service';
import { TPVInitializationService } from 'app/services/tpv-initialization.service';
import { DBSyncTableDownloadStartedArgs } from 'app/shared/signalr-server-responses/pos-hub/dbsync-table-download-started-args';
import { DBSyncProgressChangedArgs } from 'app/shared/signalr-server-responses/pos-hub/dbsync-progress-changed-args';
import { DBSyncFinishedArgs } from 'app/shared/signalr-server-responses/pos-hub/dbsync-finished-args';
import { SignalRTMEService } from 'app/services/signalr/signalr-tme.service';
import { TMEButtonTestResponseStatuses } from 'app/shared/hubble-pos-signalr-responses/tme-button-test-response-statuses.enum';
import { TMEApplicationInitResponseStatuses } from 'app/shared/hubble-pos-signalr-responses/tme-application-init-response-statuses.enum';
import { OperatorService } from 'app/services/operator/operator.service';

import { SignalROPOSService } from 'app/services/signalr/signalr-opos.service';
import { OPOSDisplayApplicationInitResponseStatuses } from 'app/shared/hubble-pos-signalr-responses/opos-displayappinit-response-statuses.enum';
import { OPOSCashDrawerApplicationInitResponseStatuses } from 'app/shared/hubble-pos-signalr-responses/opos-cashdrawerappinit-response-statuses.enum';
import { LanguageService } from 'app/services/language/language.service';
import { FuellingPointsService } from 'app/services/fuelling-points/fuelling-points.service';
import { Globals } from 'app/services/Globals/Globals';
import { GenericHelper } from 'app/helpers/generic-helper';
import { GetPSSInitialConfigurationResponseStatuses } from 'app/shared/hubble-pos-signalr-responses/get-pss-initial-configuration-status.enum';
import { SignalRPSSService } from 'app/services/signalr/signalr-pss.service';
import { GetPSSInitialConfigurationResponse } from 'app/shared/hubble-pos-signalr-responses/get-pss-initial-configuration-response';
import { DocumentInternalService } from 'app/services/document/document-internal.service';
import { SignalRMultiTPVService } from 'app/services/signalr/signalr-multitpv.service';
import { MultitpvFuellingPointsService } from 'app/services/multitpv/multitpv-fuelling-points.service';
import { LogHelper } from 'app/helpers/log-helper';
import { ConfirmActionService } from 'app/services/confirm-action/confirm-action.service';
import { ConfirmActionType } from 'app/shared/confirmAction/confirm-action-type.enum';


@Component({
  selector: 'tpv-status-bar',
  templateUrl: './status-bar.component.html',
  styleUrls: ['./status-bar.component.scss'],
  // providers: [TPVInitializationService]
})

/*
TODO: falta que la llamada al servicio se implemente haciendo una petición real a plataforma y revisar los enums de los estatus
de la respuesta a devolver.
También conseguir dar estilo a los tooltips o mensajes que aparecen (aumentar tamaño de letra, etc.).
En cuanto a los tooltips se pueden ver clicando en el elemento y desaparecen igual, pero quizás habría que deshabilitar que se vean
al pasar el ratón por encima, que con el click sea suficiente.
*/
export class StatusBarComponent implements OnInit, OnDestroy {
  @HostBinding('class') class = 'tpv-status-bar';
  @Output() openInformationSidenavRequested: EventEmitter<void> = new EventEmitter<void>();
  @Output() openLookScreenSidenavRequested: EventEmitter<void> = new EventEmitter<void>();

  private _subscriptions: Subscription[] = [];

  synchronizationStatus: string;
  progressValue: number;

  message = this.getLiteral('status_bar_component', 'message_StatusBar_SyncOK');
  // enumerado sobre los tipos de conexión
  connectionStatus = ConnectionStatus;
  // estado de la conexión a diferentes elementos del TPV
  tpvNetWorkConnectionStatus: ConnectionStatus = ConnectionStatus.connected;
  tmeConnectionStatus: ConnectionStatus = ConnectionStatus.unknown;
  tpvServiceConnectionStatus: ConnectionStatus = ConnectionStatus.connected;
  domsConnectionStatus: ConnectionStatus = ConnectionStatus.unknown;
  dataBaseConnectionStatus: ConnectionStatus = ConnectionStatus.unknown;
  oposConnectionStatus: ConnectionStatus = ConnectionStatus.unknown;
  multiTpvNetWorkConnectionStatus: ConnectionStatus = ConnectionStatus.unknown;
  // fecha a mostrar en la barra de estado
  date: Date;
  // intervalo de consulta de la fecha
  timerId: NodeJS.Timer;
  // posicion de los mensajes
  position: TooltipPosition;
  operator: string;
  isServerMultipleTPV: boolean;
  // mensajes sobre la conexión a diferentes elementos del TPV
  networkConnectionMessage = {
    ok: this.getLiteral('status_bar_component', 'networkConnectionMessage_ok'),
    error: this.getLiteral('status_bar_component', 'networkConnectionMessage_error'),
    unknown: this.getLiteral('status_bar_component', 'networkConnectionMessage_unknown'),
  };

  serviceConnectionMessage = {
    ok: this.getLiteral('status_bar_component', 'serviceConnectionMessage_ok'),
    error: this.getLiteral('status_bar_component', 'serviceConnectionMessage_error'),
    unknown: this.getLiteral('status_bar_component', 'serviceConnectionMessage_unknown'),
  };
  domsConnectionMessage = {
    ok: this.getLiteral('status_bar_component', 'domsConnectionMessage_ok'),
    error: this.getLiteral('status_bar_component', 'domsConnectionMessage_error'),
    unknown: this.getLiteral('status_bar_component', 'domsConnectionMessage_unknown'),
  };
  dataBaseConnectionMessage = {
    ok: this.getLiteral('status_bar_component', 'dataBaseConnectionMessage_ok'),
    error: this.getLiteral('status_bar_component', 'dataBaseConnectionMessage_error'),
    unknown: this.getLiteral('status_bar_component', 'dataBaseConnectionMessage_unknown'),
  };

  syncrConnectionMessage = {
    ok: this.getLiteral('status_bar_component', 'syncrConnectionMessage_ok'),
    error: this.getLiteral('status_bar_component', 'syncrConnectionMessage_error'),
    unknown: this.getLiteral('status_bar_component', 'syncrConnectionMessage_unknown'),
    bloqueo: this.getLiteral('status_bar_component', 'syncrConnectionMessage_Lock'),
    ayuda: this.getLiteral('status_bar_component', 'syncrConnectionMessage_Help'),
  };

  tmeConnectionMessage = {
    ok: this.getLiteral('status_bar_component', 'tmeConnectionMessage_ok'),
    error: this.getLiteral('status_bar_component', 'tmeConnectionMessage_error'),
    unknown: this.getLiteral('status_bar_component', 'tmeConnectionMessage_unknown'),
  };

  multiTpvNetworkConnectionMessage = {
    ok: this.getLiteral('status_bar_component', 'multiTpvNetworkConnectionMessage_ok'),
    error: this.getLiteral('status_bar_component', 'multiTpvNetworkConnectionMessage_error'),
    unknown: this.getLiteral('status_bar_component', 'multiTpvNetworkConnectionMessage_unknown'),
  };
  constructor(
    private _statusBarService: StatusBarService,
    private _tpvStatusCheckerService: TpvStatusCheckerService,
    private _appDataConfiguration: AppDataConfiguration,
    private _tpvInitService: TPVInitializationService,
    private _signalRPSSService: SignalRPSSService,
    private _signalRTMEService: SignalRTMEService,
    private _operatorService: OperatorService,
    private _signalROPOSService: SignalROPOSService,
    private _languageService: LanguageService,
    private _fpSvc: FuellingPointsService,
    private _docInternalSvc: DocumentInternalService,
    private _signalRMultiTPVService: SignalRMultiTPVService,
    private _svcMultiTPVFp: MultitpvFuellingPointsService,
    private  _logHelper: LogHelper,
    private _confirmService: ConfirmActionService
  ) {
    this.position = 'above';
    // fecha a mostrar en el TPV
    this.date = new Date();
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    GenericHelper._fnResizeWidthStatusBar();
  }

  ngOnInit() {
    // Nos suscribimos a los eventos de sincronización que nos provee el servicio de inicialización
    this._subscriptions.push(this._tpvInitService.dbSyncTableDownloadStarted().subscribe(
      (args: DBSyncTableDownloadStartedArgs) => this._onDBSyncTableDownloadStarted(args)));
    this._subscriptions.push(this._tpvInitService.dbSyncProgressChanged().subscribe(
      (args: DBSyncProgressChangedArgs) => this._onDBSyncProgressChanged(args)));
    this._subscriptions.push(this._tpvInitService.dbSyncFinished().subscribe(
      (args: DBSyncFinishedArgs) => this._onDBSyncFinished(args)));


    this._subscriptions.push(this._operatorService.Operador$.subscribe(d => {
      this.operator = d == undefined ? '' : d.name;
    }));
    // Suscribirse al evento cuando un usuario añade un producto para el document
    this._subscriptions.push(this._statusBarService.messageReceived()
      .subscribe(message => this.message = message));
    // Subscribirse al evento cuando alguien modifica el estado de la conexión a la red
    this._subscriptions.push(this._tpvStatusCheckerService.networkConnectionStatusChanged()
      .subscribe(
        tpvNetWorkConnectionStatus => {
          this.tpvNetWorkConnectionStatus = tpvNetWorkConnectionStatus;
        }));
    // Subscribirse al evento cuando alguien modifica el estado de la conexión al servicio
    this._subscriptions.push(this._tpvStatusCheckerService.serviceConnectionStatusChanged()
      .subscribe(
        tpvServiceConnectionStatus => {
          this.tpvServiceConnectionStatus = tpvServiceConnectionStatus;
        }));
    this._subscriptions.push(this._statusBarService.onDOMSConectionChange()
      .subscribe(response => {
        this.domsConnectionStatus = response;
        if (this.domsConnectionStatus == this.connectionStatus.connected) {
          this._fpSvc.fnFpVerifyReconexion(true);
        } else {
          this._fpSvc.fnFpVerifyReconexion(false);
        }
      }));
    this._subscriptions.push(this._statusBarService.onDBConnectionChange()
      .subscribe(response => {
        this.dataBaseConnectionStatus = response;
      }));
    this._subscriptions.push(this._statusBarService.onProgressChange()
      .subscribe(progress => {
        this.animateProgressBar(progress);
      }));

    this._subscriptions.push(this._signalRTMEService.onConnectionStatusChanged()
      .subscribe(response => {
        if (response) {
          // this.message = this.tmeConnectionMessage.ok;
          this.tmeConnectionStatus = ConnectionStatus.connected;
        } else {
          this.tmeConnectionStatus = ConnectionStatus.disconnected;
        }
      }));

    this._subscriptions.push(this._signalROPOSService.onConnectionStatusChanged()
      .subscribe(response => {
        if (response) {
          // this.message = this.tmeConnectionMessage.ok;
          this.oposConnectionStatus = ConnectionStatus.connected;
        } else {
          // this.message = this.tmeConnectionMessage.error;
          this.oposConnectionStatus = ConnectionStatus.disconnected;
        }
      }));

    if (this._appDataConfiguration && this._appDataConfiguration.clockRefreshFrecuency) {
      this.timerId = <any>setInterval(() => this.updateDate(), this._appDataConfiguration.clockRefreshFrecuency);
    }

    Promise.resolve(this._signalRTMEService.startInitializationProcess()).then(
      response => {
        if (response.status === TMEApplicationInitResponseStatuses.successful) {
          this.tmeConnectionStatus = ConnectionStatus.connected;
          this._signalRTMEService.setStatusConnection(true);
        } else {
          this.tmeConnectionStatus = ConnectionStatus.disconnected;
          this._signalRTMEService.setStatusConnection(false);
        }
      });

    Promise.resolve(this._signalROPOSService.startInitiOPOSDisplayProcess()).then(
      response => {
        if (response.status === OPOSDisplayApplicationInitResponseStatuses.successful) {
          this.oposConnectionStatus = ConnectionStatus.connected;
          this._signalROPOSService.setStatusConnection(true);
        } else {
          this.oposConnectionStatus = ConnectionStatus.disconnected;
          this._signalROPOSService.setStatusConnection(false);
        }
      });

    Promise.resolve(this._signalROPOSService.startInitiOPOSCashDrawerProcess()).then(
      response => {
        if (response.status === OPOSCashDrawerApplicationInitResponseStatuses.successful) {
          this.oposConnectionStatus = ConnectionStatus.connected;
          this._signalROPOSService.setStatusConnection(true);
        } else {
          this.oposConnectionStatus = ConnectionStatus.disconnected;
          this._signalROPOSService.setStatusConnection(false);
        }
      });

    this.isServerMultipleTPV = this._appDataConfiguration.isServerMultipleTPV;
    this.multiTpvNetWorkConnectionStatus = this._statusBarService.getMultiTPVConnectionStatus();
    this._subscriptions.push(this._statusBarService.multiTPVConectionChange$
      .subscribe(response => {
        this.multiTpvNetWorkConnectionStatus = response;
        if (response == ConnectionStatus.reconnected) {
          if (!this._appDataConfiguration.isServerMultipleTPV) {
            this.sendInfoAllFuellingPointModeToServer();
            this.sendAllDocumentVirtualDomsToServer();
          }
        }
      }));

      this._subscriptions.push(this._statusBarService.reconnectServiceHub$
        .subscribe(respuesta => {
          if (respuesta) {
            this.actualizarTpv();
          }
        }));
  }

  getLiteral(group: string, key: string): string {
    return this._languageService.getLiteral(group, key);
  }
  ngOnDestroy() {
    this._subscriptions.forEach(s => s.unsubscribe());
    // Nos des-suscribimos a los eventos de sincronización que nos provee el servicio de inicialización
    clearInterval(this.timerId);
  }

  updateDate() {
    this.date = new Date();
  }

  openIformationSidenav() {
    this.openInformationSidenavRequested.emit();
  }
  openIformationSidenav1() {
    this.openLookScreenSidenavRequested.emit();
  }

  // sincronizar datos tpv
  async syncronizarDatos() {
    this.message = this.getLiteral('status_bar_component', 'syncronizarDatos_message');
    this.ValidarBloquearSumiAnul();
    if (this.VerificaBloqueoSync()) {
      this.message = this.getLiteral('status_bar_component', 'syncrData_Blocked');
    } else {
      Promise.resolve(this._tpvInitService.synchronizationAsync()).then(
        response => {
          if (response === true) {
            this.message = this.getLiteral('status_bar_component', 'syncronizarDatos_message_if');
          } else {
            this.message = this.getLiteral('status_bar_component', 'syncronizarDatos_message_else');
          }
        });
    }
    GenericHelper._fnResizeWidthStatusBar();
  }

  private ValidarBloquearSumiAnul(): void {
    this._fpSvc.GetAllSuppliesAnulatedByShop()
      .first().subscribe(response => {
        Globals.Delete();
        if (response != undefined && response.length > 0) {
          response.forEach(x => {
            const point = Globals.Get().find(s => s.id === x.fuellingPointId);

            if (point !== undefined && point !== null) {
              Globals.Put(x.fuellingPointId, true);
            } else {
              Globals.Set(x.fuellingPointId, true);
            }
          });
        }
      });
  }

  async syncPSSDoms() {
    this._signalRPSSService.startInitializationProcess().subscribe((pssInitialConfigResponse: GetPSSInitialConfigurationResponse) => {
      this._logHelper.trace(pssInitialConfigResponse);
      if (pssInitialConfigResponse.status === GetPSSInitialConfigurationResponseStatuses.successful) {
        this.message = this.domsConnectionMessage.ok;
        this._logHelper.trace('Configuración inicial de PSS OK->');
        this._logHelper.trace(pssInitialConfigResponse.message);
      } else {
        this.message = this.domsConnectionMessage.error;
        this._logHelper.trace('Configuración inicial de PSS KO->');
        this._logHelper.trace(pssInitialConfigResponse.message);
      }
      GenericHelper._fnResizeWidthStatusBar();
    });
  }

  // sincronizar datos tme e intento de conexion
  async syncTMEDatos() {
    this.message = this.getLiteral('status_bar_component', 'syncTMEDatos_message');
    Promise.resolve(this._signalRTMEService.TMEButtonTest()).then(response => {
      if (response.status === TMEButtonTestResponseStatuses.successful) {
        this.message = this.tmeConnectionMessage.ok;
        this.tmeConnectionStatus = ConnectionStatus.connected;
        this._signalRTMEService.setStatusConnection(true);
      } else if (response.status === TMEButtonTestResponseStatuses.genericError) {
        this.message = this.tmeConnectionMessage.error;
        this.tmeConnectionStatus = ConnectionStatus.disconnected;
        this._signalRTMEService.setStatusConnection(false);
      }
    });
    GenericHelper._fnResizeWidthStatusBar();
  }

  private animateProgressBar(progress: number) {
    jQuery('.status-progress-bar').animate({ width: `${progress}%` },
      () => {
        setTimeout(() => {
          jQuery('.status-progress-bar').css('width', '5%');
        }, 3000);
      });
    /*NOTA 130218: Prueba rápida del status-progress-bar. Si el cliente acepta, habrá que reformularlo*/
  }


  //#region event handlers
  private _onDBSyncTableDownloadStarted(args: DBSyncTableDownloadStartedArgs) {
    this.synchronizationStatus = `${args.synchronizationProcessName} - ${args.tableName}`;
  }

  private _onDBSyncProgressChanged(args: DBSyncProgressChangedArgs) {
    this.synchronizationStatus = args.synchronizationProcessName;
    this.progressValue = args.progressPercentage;
  }

  private _onDBSyncFinished(args: DBSyncFinishedArgs) {
    this.synchronizationStatus = `${args.synchronizationProcessName}`;
  }
  //#endregion event handlers

  private VerificaBloqueoSync(): Boolean {
    let bBloquear: Boolean = false;
    const lstComponentsBloqueados: Array<string> = [];
    if (this._appDataConfiguration.getConfigurationParameterByName('COMPONENT_SYNCHRONIZATION_BLOCKED', 'SYNCHRONIZATION')) {
      const strComponentConfig =
        this._appDataConfiguration.getConfigurationParameterByName('COMPONENT_SYNCHRONIZATION_BLOCKED', 'SYNCHRONIZATION').meaningfulStringValue;
      if ((strComponentConfig) && (strComponentConfig.length > 0)) {
        strComponentConfig.split(',').forEach(function (value) {
          lstComponentsBloqueados.push(value);
        });
      }
      if (this._docInternalSvc.hasAnyDocumentWithLine()) {
        lstComponentsBloqueados.forEach(function (value) {
          const elementExists = document.querySelector(value);
          if (document.body.contains(elementExists)) {
            if ((elementExists as HTMLElement).offsetParent) {
              bBloquear = true;
            }
          }
        });
      }
    } else {
      this._logHelper.trace('VerificaBloqueoSync _ No existe el parámetro de configuracion : COMPONENT_SYNCHRONIZATION_BLOCKED');
    }
    return bBloquear;
  }

  async sendInfoAllFuellingPointModeToServer() {
    this._fpSvc.GetAllFuellingPointOperationMode()
      .first()
      .subscribe(
        (response) => {
          if (response) {
            this._signalRMultiTPVService.sendFuellingPointOperationModeToServer(response).subscribe();
          }
        }
      );
  }
  async sendAllDocumentVirtualDomsToServer() {
    this._svcMultiTPVFp.GetAllDocumentVirtualDoms()
      .first()
      .subscribe(
        (response) => {
          if (response) {
            this._signalRMultiTPVService.sendDocumentVirtualDomsToServer(response).subscribe();
          }
        }
      );
  }

  private actualizarTpv() {
    this._confirmService.promptActionConfirm(
      '¿Desea continuar? Se ha reiniciado el servicio, es necesario reiniciar el TPV.',
      'Aceptar',
      'Cancelar',
      'Reiniciar TPV',
      ConfirmActionType.Warning
    ).first().subscribe( respuesta => {
      if (respuesta) {
        location.reload();
      }
    });
  }

}
