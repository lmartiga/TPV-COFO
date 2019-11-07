import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { Subscriber } from 'rxjs/Subscriber';
import { AppDataConfiguration } from 'app/config/app-data.config';
import { FormatHelper } from 'app/helpers/format-helper';
// import { LogHelper } from 'app/helpers/log-helper';
import { HttpService } from 'app/services/http/http.service';
import { ActionType } from 'app/shared/electronic-journal/action-type.enum';
import { JournalAction } from 'app/shared/electronic-journal/journal-action';
import { Operator } from 'app/shared/operator/operator';
import { CreateJournalActionsResponse } from 'app/shared/web-api-responses/create-journal-actions-response';
import { CreateJournalActionsResponseStatuses } from 'app/shared/web-api-responses/create-journal-actions-response-statuses.enum';
import { Subscription } from 'rxjs/Subscription';
import { LogInternalService } from '../logger/log-internal.service';

@Injectable()
export class ElectronicJournalService {

  currentOperator: Operator;
  private _numberOfPendingActions: number = 0;
  private _delayLocalStorageInsertions: boolean = false;

  private _uploadTimer: NodeJS.Timer;
  private _subscriptions: Subscription[] = [];
  
  constructor(
    private _http: HttpService,
    private _config: AppDataConfiguration,
    private _logInternal: LogInternalService
  ) {
    this._subscriptions.push(this._logInternal.$infoLog
    .subscribe(response => {
      if (response) {
          this.writeAction(response);
      }
    }));
  }

  // Inicializa el diario electrónico y ejecuta un intento de envío de la información pendiente.
  startJournal(): Observable<boolean> {
    this._trace('Inicializando diario electrónico con los siguientes valores:' + '\r\n' +
                'Clave LocalStorage: ' + this._config.electronicJournalLocalStorageKey + '\r\n' +
                '# de entradas para envío: ' + this._config.electronicJournalUploadJournalThreshold + '\r\n' +
                'Tiempo entre envíos (ms): ' + this._config.electronicJournalMaximumMillisecondsBetweenUploads);

    // Se recupera el listado de delayed por si hubiera pendientes aplazados de una ejecución anterior
    this._synchronizeDelayedInserts();

    // Se ejecuta un envío de la información pendiente. Implica que se inicializará el temporizador de envío
    return this._uploadJournal();
  }

  // Inserta una entrada del diario electrónico de forma temporal en el almacén local.
  writeAction(journalAction: JournalAction) {
    // Rellenamos la fecha y hora con el valor actual
    journalAction.localDateTime = FormatHelper.dateToISOString(new Date()).toString();

    // Añadimos el nombre del operador actual, si no se proporcionó
    if (journalAction.operatorName == undefined && this.currentOperator != undefined) {
      journalAction.operatorName = this.currentOperator.name;
    }

    if (this._delayLocalStorageInsertions == false) {
      // Recuperamos información de la clave localStorage asociada
      let actionList: Array<JournalAction> = JSON.parse(localStorage.getItem(this._config.electronicJournalLocalStorageKey));

      // Inicializamos la lista si fuera necesario
      if (actionList == undefined) {
        actionList = [];
      }

      // Añadimos la nueva entrada a la lista temporal y actualizamos el número de elementos pendiente de subida
      this._numberOfPendingActions = actionList.push(journalAction);
      // Actualizamos localStorage
      localStorage.setItem(this._config.electronicJournalLocalStorageKey, JSON.stringify(actionList));

      // Si se sobrepasa el cupo de elementos a persistir localmente, se solicita un envío de información
      if (this._numberOfPendingActions >= this._config.electronicJournalUploadJournalThreshold) {
        this._trace(`Se encontraron ${this._numberOfPendingActions} entradas pendientes de envío`);
        this._uploadJournal();
      }
    } else { // Aplazar inserciones poniendo los nuevos items en un listado temporal.
      // Recuperamos información de la clave localStorage asociada
      let delayedActionList: Array<JournalAction> = JSON.parse(localStorage.getItem(this._config.electronicJournalLocalStorageKey + '_DELAYED'));

      if (delayedActionList == undefined) {
        delayedActionList = [];
      }
      delayedActionList.push(journalAction);
      localStorage.setItem(this._config.electronicJournalLocalStorageKey + '_DELAYED', JSON.stringify(delayedActionList));

      this._trace(`Inserción aplazada. Se hará efectiva al completar el envío de información actual.`);
    }
  }

  // Lee el localStorage y envía las entradas pendientes. Si logra la subida, lo limpia
  private _uploadJournal(): Observable<boolean> {
    return Observable.create((observer: Subscriber<boolean>) => { 
      this._manageUploadTimer(false);

      const recoveredJSON: string = localStorage.getItem(this._config.electronicJournalLocalStorageKey);
      if (recoveredJSON != undefined) {
        // Inhibimos las inserción de nuevas entradas mientras se envían los pendientes
        this._delayLocalStorageInsertions = true;

         // Se enviarán en bloques de electronicJournalUploadJournalThreshold elementos
        //     Se comprueba la calidad de los contenidos con typeof number || string para todas las propiedades que no son type
        //     y se corrigen los errores encontrados
        // Se recupera la info de la clave designada en localStorage
        const recoveredActionList: Array<JournalAction> = JSON.parse(recoveredJSON);
        this._validateAndFixJournalActionList(recoveredActionList);
        const request = {
          identity: this._config.userConfiguration.Identity,
          actionList: recoveredActionList.slice(0,  this._config.electronicJournalUploadJournalThreshold),
        };

         // Demoramos la solicitud de los que superen el threshold establecido
        const pendingActionsList = recoveredActionList.slice(this._config.electronicJournalUploadJournalThreshold);

        // Se envía a WebAPI
        this._http.postJsonObservable(`${this._config.apiUrl}/CreateJournalActions`, request).first().subscribe(
          (response: CreateJournalActionsResponse) => {
            this._manageUploadTimer();
            // Si se recibe Ok, se vacía la clave en localStorage
            if (response.status == CreateJournalActionsResponseStatuses.successful) {
              this._trace(JSON.stringify(response.message));
              localStorage.removeItem(this._config.electronicJournalLocalStorageKey);
              localStorage.setItem(this._config.electronicJournalLocalStorageKey, JSON.stringify(pendingActionsList));
              this._synchronizeDelayedInserts();
              observer.next(true);
            } else {
              // Si se recibe Ko, se traza la información que no se pudo enviar y se mantiene la info para el siguiente intento.
              this._trace(
                `La respuesta ha sido negativa: ${CreateJournalActionsResponseStatuses[response.status]}. Mensaje: ${response.message}`);
              this._synchronizeDelayedInserts();
              observer.next(false);
            }
          },
          error => {
            this._trace(
              `Se produjo un error al solicitar la ejecución del servicio CreateJournalActions: ${error}`);
            this._manageUploadTimer();
            this._synchronizeDelayedInserts();
            observer.next(false);
          });
      } else {
        this._trace('No se encontraron entradas pendientes de envío');
        this._manageUploadTimer();
        observer.next(true);
      }
    });
  }

  // Maneja el temporizador de envío de entradas pendientes. Acepta un parámetro que arranca/detiene el temporizador
  private _manageUploadTimer(startNotStop: boolean = true) {
    if (this._uploadTimer != undefined) {
      clearTimeout(this._uploadTimer);
    }
    if (startNotStop == true) {
      this._uploadTimer = setTimeout(() => {
          this._trace('Lanzando envío temporizado...');
          this._uploadJournal().first().subscribe(succeed => {
              this._trace('Envio temporizado completado.');
          });
        }, this._config.electronicJournalMaximumMillisecondsBetweenUploads);
    }
  }

  // Recupera del local Storage y sincroniza una eventual lista de acciones aplazada con la lista de acciones pendientes de envío
  private _synchronizeDelayedInserts() {
    const delayedLocalStorageKey: string = this._config.electronicJournalLocalStorageKey + '_DELAYED';
    const delayedJSONInformation: string = localStorage.getItem(delayedLocalStorageKey);
    if (delayedJSONInformation != undefined) {
      localStorage.removeItem(delayedLocalStorageKey);

      const recoveredJSONInformation: string = localStorage.getItem(this._config.electronicJournalLocalStorageKey);
      if (recoveredJSONInformation != undefined) {
        // Merge both actionLists
        const mainActionList: Array<JournalAction> = JSON.parse(recoveredJSONInformation);
        const delayedActionList: Array<JournalAction> = JSON.parse(delayedJSONInformation);
        delayedActionList.forEach(element => {
          mainActionList.push(element);
        });
        localStorage.setItem(this._config.electronicJournalLocalStorageKey, JSON.stringify(mainActionList));
      } else {
        // MAIN LOCAL STORAGE is empty
        localStorage.setItem(this._config.electronicJournalLocalStorageKey, delayedJSONInformation);
      }
    }

    this._delayLocalStorageInsertions = false;
  }

  // Valida y corrige las acciones comprobando el tipado de las propiedades de las mismas.
  private _validateAndFixJournalActionList(actionList: Array<JournalAction>) {
    actionList.forEach(action => {
      Object.entries(action).forEach(([key, value]) => {
        if (key != 'type' &&
            (typeof value !== 'string' && typeof value !== 'number')) {
              // Notificar y corregir acción
              const correctedAction: JournalAction = {
                type: ActionType.customMessage,
                genericDetail: `Identificada acción no válida: ${JSON.stringify(action)}`
              };
              this._trace(correctedAction.genericDetail);

              action = correctedAction;
        }
      });
    });
  }

  // Encapsula las trazas con un encabezado que indica este origen
  private _trace(message: string) {
    // this._logHelper.trace(`[Electronic Journal] ${message}`);
  }
}
