import { Component, OnInit, HostBinding, OnDestroy} from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { Subject } from 'rxjs/Subject';
import { ISubscription } from 'rxjs/Subscription';
import { AppDataConfiguration } from 'app/config/app-data.config';
import { LogHelper } from 'app/helpers/log-helper';
import { GenericHelper } from 'app/helpers/generic-helper';
import { ConfirmActionService } from 'app/services/confirm-action/confirm-action.service';
import { DocumentInternalService } from 'app/services/document/document-internal.service';
import { KeyboardInternalService } from 'app/services/keyboard/keyboard-internal.service';
import { StatusBarService } from 'app/services/status-bar/status-bar.service';
import { ConfirmActionType } from 'app/shared/confirmAction/confirm-action-type.enum';
import { Currency } from 'app/shared/currency/currency';
import { IActionFinalizable } from 'app/shared/iaction-finalizable';
import { PrintResponse } from 'app/shared/signalr-server-responses/printingModuleHub/print-response';
import { PrintResponseStatuses } from 'app/shared/signalr-server-responses/printingModuleHub/print-response-statuses.enum';

import { CashboxRecordDataOffline } from '../../shared/shared-cierre-diferido/cashbox-record-offline-data';
import { CashboxRecordTypeOffline } from '../../shared/shared-cierre-diferido/cashbox-record-offline-type.enum';
import { CashboxRecordReasonOff } from '../../shared/shared-cierre-diferido/cashbox-record-off-Reason';
import { CashboxOfflineService } from '../../services/cash-offline-services/cashbox-offline.service';
// import { SignalRPrintingService } from 'app/services/signalr/signalr-printing.service';
/* import { ConnectedPositionStrategy } from '@angular/material'; */
import { LanguageService } from 'app/services/language/language.service';
import { PrintingService } from 'app/services/printing/printing.service';

@Component({
  selector: 'tpv-cash-out-offline',
  templateUrl: './cash-out-offline.component.html',
  styleUrls: ['./cash-out-offline.component.scss']
})

export class CashOutOfflineComponent implements OnInit, IActionFinalizable<boolean>, OnDestroy {
  @HostBinding('class') class = 'tpv-cash-out';
  public type: string;
  // Evento de salida de caja ejecutado
  private _cashOutSent: Subject<boolean> = new Subject();
  // El modelo bindeado al formulario tiene que existir (estar instanciado). Angular no lo instancia por nosotros
  private _cashOutData: CashboxRecordDataOffline = {
    tanotacion: undefined,
    cashboxRecordReasonOffline: undefined,
    importe: undefined,
    divisa: undefined,
    descripcion: undefined,
  };
  private _getAvailableCashRecordReasonsByCashboxRecordTypeSubscription: ISubscription;
  private _requestingCashOut: boolean = false;
  // Variable privada para tratar el tipo de ENTRADA O SALIDA
  private _typeCash: CashboxRecordTypeOffline;
  // Variables expuestas a HTML
  availableCashboxRecordReasonsOffline: CashboxRecordReasonOff[];
  availableCashboxRecordReasonsButtonColumnWidthList: string[];
  availableCurrencies: Currency[];
  currencyButtonColumnWidthList: string[];

  // Literales expuestos a HTML
  headerLiteral: string;
  cashRecordReasonsLiteral: string;
  amountLiteral: string;
  observationsLiteral: string;
  maximumObservationsLength: number;
  submitLiteral: string;
  eurLiteral: string;

  // Literales para mensajes genéricos al usuario
  printingLiteral: string;
  printSucceedLiteral: string;
  printFailedLiteral: string;
  errorHeaderLiteral: string;
  incompleteFormLiteral: string;
  completedOkLiteral: string;
  completedKoLiteral: string;

  // Literales para mensajes específicos
  cashOutSucceedLiteral: string;
  cashOutGenericFailureLiteral: string;
  noCashRecordTypesFoundLiteral: string;

  // Literales para los Tipos de Apuntes
  Literal002s: string;
  Literal003s: string;
  Literal004s: string;
  Literal01s: string;
  Literal002e: string;
  Literal003e: string;
  Literal004e: string;


  constructor(
    private _documentInternalService: DocumentInternalService,
    private _cashboxService: CashboxOfflineService,
    private _statusBarService: StatusBarService,
    private _keyboardInternalService: KeyboardInternalService,
    // private _printService: SignalRPrintingService,
    private _printService: PrintingService,
    private _confirmActionService: ConfirmActionService,
    private _languageService: LanguageService,
    // variables de ambito del constructor
    _configuration: AppDataConfiguration,
    private _logHelper: LogHelper,
  ) {
    this.availableCurrencies = [_configuration.baseCurrency, _configuration.secondaryCurrency];
    this.currencyButtonColumnWidthList = GenericHelper.generateButtonColumnWidthsList(5, 1, this.availableCurrencies.length);
    this._cashOutData.divisa = _configuration.baseCurrency;
    this.maximumObservationsLength = 143;

  }

  /// Método de declaración de variables.
  private literalsCashOffline() {
    this.cashRecordReasonsLiteral = this.getLiteral('cash_out_offline_component', 'literal_cashRecordReasonsLiteral');
    this.amountLiteral = this.getLiteral('cash_out_component', 'literal_CashOut_Amount');
    this.observationsLiteral = this.getLiteral('cash_out_component', 'literal_CashOut_Reason');
    this.submitLiteral = this.getLiteral('cash_out_component', 'bottomButton_CashOut_OK');
    this.eurLiteral = this.getLiteral('cash_out_offline_component', 'literal_eur');
    this.printingLiteral = this.getLiteral('cash_out_offline_component', 'literal_printing');
    this.printSucceedLiteral = this.getLiteral('cash_out_component', 'message_CashOut_PrintingCompleted');
    this.printFailedLiteral = this.getLiteral('cash_out_component', 'message_CashOut_PrintingFailed');
    this.errorHeaderLiteral = this.getLiteral('cash_out_offline_component', 'literal_mistake');
    this.incompleteFormLiteral = this.getLiteral('cash_out_component', 'message_CashOut_FormIncompleted');
    this.completedOkLiteral = this.getLiteral('cash_out_offline_component', 'literal_operation_finalized');
    this.completedKoLiteral = this.getLiteral('cash_out_offline_component', 'literal_operation_finalized');
    this.noCashRecordTypesFoundLiteral = this.getLiteral('cash_out_component', 'message_CashOut_AnnotationTypesWereNotObtaioned');
    this.Literal002e = this.getLiteral('cash_out_offline_component', 'literal_tickets_cajon');
    this.Literal003e = this.getLiteral('cash_out_offline_component', 'literal_other_entries');
    this.Literal004e = this.getLiteral('cash_out_offline_component', 'literal_charges_suppliers');
    this.Literal01s = this.getLiteral('cash_out_offline_component', 'literal_once_payments');
    this.Literal002s = this.getLiteral('cash_out_offline_component', 'literal_withdrawals_box');
    this.Literal003s = this.getLiteral('cash_out_offline_component', 'literal_others_withdrawals');
    this.Literal004s = this.getLiteral('cash_out_offline_component', 'literal_payments_suppliers');
  }

  ngOnInit() {

    // TYPE: 'ENTRADA' o 'SALIDA' se define en options.component.ts en las llamadas al componente.
    let typeLiteral;

    switch (this.type) {
      case 'ENTRADA':
        this._typeCash = CashboxRecordTypeOffline.cashEntry;
        typeLiteral = this.getLiteral('cash_out_offline_component', 'literal_entry');
      break;
      default:
        typeLiteral = this.getLiteral('cash_out_offline_component', 'literal_exit');
        this._typeCash = CashboxRecordTypeOffline.cashOut;
    }

    // Literales modificados por el tipo de funcionalidad
    this.headerLiteral = typeLiteral + ' ' + this.getLiteral('cash_out_offline_component', 'literal_ofbox_offline');
    this.cashOutSucceedLiteral = typeLiteral + ' ' + this.getLiteral('cash_out_offline_component', 'literal_cashout_succeed');
    this.cashOutGenericFailureLiteral = this.getLiteral('cash_out_offline_component', 'literal_cashout_generic1') + typeLiteral +
    this.getLiteral('cash_out_offline_component', 'literal_cashout_generic2');

    this.literalsCashOffline();
    // Se obtienen los CashRecordTypes PERMITIDOS
    this.fillAvailableCashRecordTypes();
    this._keyboardInternalService.CloseKeyBoard();
  }
  getLiteral(group: string, key: string): string {
    return this._languageService.getLiteral(group, key);
  }
  set cashOutData(cashOutData: CashboxRecordDataOffline) {
    this._cashOutData = cashOutData;
  }

  get cashOutData() {
    return this._cashOutData;
  }
  // Retransmite el evento de ejecución completada
  onFinish(): Observable<boolean> {
    return this._cashOutSent.asObservable();
  }

  // Lanza el evento con resultado negativo ante un cierre forzoso
  forceFinish(): void {
    this._keyboardInternalService.CloseKeyBoard();
    this._cashOutSent.next(false);
  }

  ngOnDestroy() {
    // Se libera la subscripción de solicitud de datos en la apertura del panel
    this._getAvailableCashRecordReasonsByCashboxRecordTypeSubscription.unsubscribe();
  }

  onSubmit() {
     this._keyboardInternalService.CloseKeyBoard();
      if (this._documentInternalService != undefined &&
        this._documentInternalService.currentDocument != undefined &&
        this._documentInternalService.currentDocument.operator != undefined &&
        this._cashOutData.importe != undefined &&
        this._cashOutData.descripcion != undefined &&
        this._cashOutData.divisa != undefined &&
        this._cashOutData.cashboxRecordReasonOffline != undefined
      ) {
        const currentDateTime: Date = new Date();
        this._cashboxService.createCashboxRecordOffline(
          this._documentInternalService.currentDocument.operator,
          this._typeCash,
          this._cashOutData,
          currentDateTime)
          .first()
          .subscribe(response => {
            if (response == true) {
              this._logHelper.trace(this.cashOutSucceedLiteral);
              this._statusBarService.publishMessage(this.cashOutSucceedLiteral);
              this._statusBarService.publishMessage(this.printingLiteral);
              // Se invoca la impresión al servicio de impresión signalR de angular
              this._printService.printCashboxOfflineRecord(
                this._documentInternalService.currentDocument.operator,
                this._typeCash,
                this._cashOutData,
                currentDateTime,
              )
              .first()
              .subscribe(
              (printResponse: PrintResponse) => {
                if (printResponse.status == PrintResponseStatuses.successful) {
                  // Si la respuesta de ambas solicitudes es positiva, reportamos ok al llamante
                  this._statusBarService.publishMessage(this.printSucceedLiteral + ' ' +  this.cashOutSucceedLiteral);
                  this._cashOutSent.next(true);
                } else {
                  // Impresión falló con respuesta positiva
                  this._logHelper.trace(
                    `La respuesta ha sido positiva, pero la impresión falló: ` +
                    `${PrintResponseStatuses[printResponse.status]}. Mensaje: ${printResponse.message}`);
                  this._confirmActionService.promptActionConfirm(
                    this.printFailedLiteral + ' ' + this.completedOkLiteral,
                    this.submitLiteral,
                    undefined,
                    this.errorHeaderLiteral,
                    ConfirmActionType.Error
                  ).first().subscribe(r =>
                    this._cashOutSent.next(false)
                  );
                }
              });
            } else {
              // Respuesta negativa
              this._logHelper.trace(this.completedKoLiteral);
              this._confirmActionService.promptActionConfirm(
                this.completedKoLiteral,
                this.submitLiteral,
                undefined,
                this.errorHeaderLiteral,
                ConfirmActionType.Error
              ).first().subscribe(r =>
                this._cashOutSent.next(false)
              );
            }
          },
          error => {
            // Error genérico
            this._logHelper.trace(`${this.cashOutGenericFailureLiteral}: ${error.toString()}`);
            this._confirmActionService.promptActionConfirm(
              this.cashOutGenericFailureLiteral,
              this.submitLiteral,
              undefined,
              this.errorHeaderLiteral,
              ConfirmActionType.Error
            ).first().subscribe(r =>
              this._cashOutSent.next(false)
            );
          });
        } else {
        // Formulario incompleto!!!
        this._logHelper.trace(this.incompleteFormLiteral);
        this._confirmActionService.promptActionConfirm(
          this.incompleteFormLiteral,
          this.submitLiteral,
          undefined,
          this.errorHeaderLiteral,
          ConfirmActionType.Error
        ).first().subscribe();
      }

    }

cashboxRecordReasonSelected(item: CashboxRecordReasonOff) {
    this._keyboardInternalService.CloseKeyBoard();
    this._logHelper.trace(`CashboxRecordReason selected. Previous info: ${this._cashOutData.cashboxRecordReasonOffline.codigo}`);
    this._cashOutData.cashboxRecordReasonOffline = item;
    this._logHelper.trace(`CashboxRecordReason selected. New info: ${this._cashOutData.cashboxRecordReasonOffline.codigo}`);
  }

  currencySelected(item: Currency) {
    this._keyboardInternalService.CloseKeyBoard();
    this._logHelper.trace(`Currency selected. Previous info: ${this._cashOutData.divisa.id}`);
    this._cashOutData.divisa = item;
    this._logHelper.trace(`Currency selected. New info: ${this._cashOutData.divisa.id}`);
  }

  onAmountKeyEnterPressed() {
    // TODO: DE MOMENTO, NO HACER NADA CUANDO SE INTRODUZCA 'ENTER'
  }

  onObservationsKeyEnterPressed() {
    // TODO: DE MOMENTO, NO HACER NADA CUANDO SE INTRODUZCA 'ENTER'
  }

  isRequestingCashOut(): boolean {
    return this._requestingCashOut;
  }

  // Consulta  y devuelve los tipo de apuntes
   private fillAvailableCashRecordTypes() {
    this._getAvailableCashRecordReasonsByCashboxRecordTypeSubscription =
      this._cashboxService.getAvailableCashRecordReasonsByCashboxRecordType(this._typeCash)
      .first()
      .subscribe(result => {
        if (this.type == 'ENTRADA') {
          for (let i = 0; i < result.length; i++) {
            if (result[i].codigo.substring(5, result[i].codigo.length) == '01') {
              result.splice(i, 1);
            }
          }
        }
        this.availableCashboxRecordReasonsOffline = result;
        // Cambiar literales de tipo apunte
        this.availableCashboxRecordReasonsOffline.forEach(e => {
          switch (e.codigo.substring(5, e.codigo.length)) {
            case '01':
                if (this.type == 'SALIDA') {
                  e.caption = this.Literal01s;
                }
              break;
            case '002':
                if (this.type == 'ENTRADA') {
                  e.caption = this.Literal002e;
                } else {
                  e.caption = this.Literal002s;
                }
              break;
            case '003':
              if (this.type == 'ENTRADA') {
                e.caption = this.Literal003e;
              } else {
                e.caption = this.Literal003s;
              }
            break;
            case '004':
              if (this.type == 'ENTRADA') {
                e.caption = this.Literal004e;
              } else {
                e.caption = this.Literal004s;
              }
            break;
            default:
              e.caption = this.Literal002e;
              break;
          }
        });

        if (this.availableCashboxRecordReasonsOffline != undefined &&
          this.availableCashboxRecordReasonsOffline.length > 0) {
          // Se selecciona uno de los CashRecordTypes obtenidos de forma predeterminada
          this._cashOutData.cashboxRecordReasonOffline = this.availableCashboxRecordReasonsOffline[0];
          // Se formatea el tamaño de los botones mostrados
          this.availableCashboxRecordReasonsButtonColumnWidthList =
            GenericHelper.generateButtonColumnWidthsList(5, 1, this.availableCashboxRecordReasonsOffline.length);
        } else {
          this._logHelper.trace(this.noCashRecordTypesFoundLiteral);
          this._confirmActionService.promptActionConfirm(
            this.noCashRecordTypesFoundLiteral,
            this.submitLiteral,
            undefined,
            this.errorHeaderLiteral,
            ConfirmActionType.Error
          ).first().subscribe(r =>
            // reportar resultado negativo al llamante
            this.forceFinish()
          );
        }
      });
  }
}
