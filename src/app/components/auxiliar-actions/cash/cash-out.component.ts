import { Component, OnInit, HostBinding, OnDestroy } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { Subject } from 'rxjs/Subject';
import { ISubscription } from 'rxjs/Subscription';

import { AppDataConfiguration } from 'app/config/app-data.config';
import { LogHelper } from 'app/helpers/log-helper';
import { GenericHelper } from 'app/helpers/generic-helper';
import { CashboxService } from 'app/services/cash/cashbox.service';
import { ConfirmActionService } from 'app/services/confirm-action/confirm-action.service';
import { DocumentInternalService } from 'app/services/document/document-internal.service';
import { KeyboardInternalService } from 'app/services/keyboard/keyboard-internal.service';
// import { SignalRPrintingService } from 'app/services/signalr/signalr-printing.service';
import { StatusBarService } from 'app/services/status-bar/status-bar.service';
import { CashboxRecordData } from 'app/shared/cashbox/cashbox-record-data';
import { CashboxRecordReason } from 'app/shared/cashbox/cashbox-record-reason';
import { CashboxRecordType } from 'app/shared/cashbox/cashbox-record-type.enum';
import { ConfirmActionType } from 'app/shared/confirmAction/confirm-action-type.enum';
import { Currency } from 'app/shared/currency/currency';
import { IActionFinalizable } from 'app/shared/iaction-finalizable';
import { PrintResponse } from 'app/shared/signalr-server-responses/printingModuleHub/print-response';
import { PrintResponseStatuses } from 'app/shared/signalr-server-responses/printingModuleHub/print-response-statuses.enum';
import { LanguageService } from 'app/services/language/language.service';
import { PrintingService } from 'app/services/printing/printing.service';

@Component({
  selector: 'tpv-cash-out',
  templateUrl: './cash-out.component.html',
  styleUrls: ['./cash-out.component.scss']
})
export class CashOutComponent implements OnInit, IActionFinalizable<boolean>, OnDestroy {
  @HostBinding('class') class = 'tpv-cash-out';

  // Evento de salida de caja ejecutado
  private _cashOutSent: Subject<boolean> = new Subject();
  // El modelo bindeado al formulario tiene que existir (estar instanciado). Angular no lo instancia por nosotros
  private _cashOutData: CashboxRecordData = {
    cashboxRecordReason: undefined, amount: undefined, currency: undefined, observations: undefined
  };
  private _getAvailableCashRecordReasonsByCashboxRecordTypeSubscription: ISubscription;
  private _requestingCashOut: boolean = false;

  // Variables expuestas a HTML
  availableCashboxRecordReasons: CashboxRecordReason[];
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

  constructor(
    private _documentInternalService: DocumentInternalService,
    private _cashboxService: CashboxService,
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
    this.currencyButtonColumnWidthList = GenericHelper.generateButtonColumnWidthsList(12, 3, this.availableCurrencies.length);
    this._cashOutData.currency = _configuration.baseCurrency;

    this.headerLiteral = this.getLiteral('cash_out_component', 'header_CashOut');
    this.cashRecordReasonsLiteral = this.getLiteral('cash_out_component', 'literal_CashOut_AnnotationType');
    this.amountLiteral = this.getLiteral('cash_out_component', 'literal_CashOut_Amount');
    this.observationsLiteral = this.getLiteral('cash_out_component', 'literal_CashOut_Reason');
    this.submitLiteral = this.getLiteral('cash_out_component', 'bottomButton_CashOut_OK');

    this.printingLiteral = this.getLiteral('cash_out_component', 'message_CashOut_Printing');
    this.printSucceedLiteral =  this.getLiteral('cash_out_component', 'message_CashOut_PrintingCompleted');
    this.printFailedLiteral = this.getLiteral('cash_out_component', 'message_CashOut_PrintingFailed');;
    this.errorHeaderLiteral = this.getLiteral('common', 'error');  

    this.incompleteFormLiteral = this.getLiteral('cash_out_component', 'message_CashOut_FormIncompleted');
    this.completedOkLiteral = this.getLiteral('cash_out_component', 'message_CashOut_OperationFinishedOk');
    this.completedKoLiteral = this.getLiteral('cash_out_component', 'message_CashOut_OperationFinishedKO');

    this.cashOutSucceedLiteral = this.getLiteral('cash_out_component', 'message_CashOut_CashOutMadeSuccessfully');
    this.cashOutGenericFailureLiteral = this.getLiteral('cash_out_component', 'message_CashOut_CashOutCouldNotBeFinished');
    this.noCashRecordTypesFoundLiteral = this.getLiteral('cash_out_component', 'message_CashOut_AnnotationTypesWereNotObtaioned');

    this.maximumObservationsLength = 143;
  }

  ngOnInit() {
    // Se obtienen los CashRecordTypes PERMITIDOS
    this.fillAvailableCashRecordTypes();
    this._keyboardInternalService.CloseKeyBoard();
  }

  set cashOutData(cashOutData: CashboxRecordData) {
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
    if (this._requestingCashOut === true) {
      return;
    }
    this._keyboardInternalService.CloseKeyBoard();
      if (this._documentInternalService != undefined &&
        this._documentInternalService.currentDocument != undefined &&
        this._documentInternalService.currentDocument.operator != undefined &&
        this._cashOutData != undefined &&
        this._cashOutData.amount != undefined &&
        this._cashOutData.currency != undefined &&
        this._cashOutData.cashboxRecordReason != undefined
      ) {

        this._requestingCashOut = true;
        const currentDateTime: Date = new Date();
        this._cashboxService.createCashboxRecord(
          this._documentInternalService.currentDocument.operator,
          CashboxRecordType.cashOut,
          this._cashOutData,
          currentDateTime)
          .first()
          .subscribe(response => {
            if (response == true) {
              this._logHelper.trace(this.cashOutSucceedLiteral);
              this._statusBarService.publishMessage(this.cashOutSucceedLiteral);
              this._statusBarService.publishMessage(this.printingLiteral);
              // Se invoca la impresión al servicio de impresión signalR de angular
              this._printService.printCashboxRecord(
                this._documentInternalService.currentDocument.operator,
                CashboxRecordType.cashOut,
                this._cashOutData,
                currentDateTime
              )
              .first()
              .subscribe(
              (printResponse: PrintResponse) => {
                this._requestingCashOut = false;
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
              this._requestingCashOut = false;
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
            this._requestingCashOut = false;
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

  cashboxRecordReasonSelected(item: CashboxRecordReason) {
    this._keyboardInternalService.CloseKeyBoard();
    this._logHelper.trace(`CashboxRecordReason selected. Previous info: ${this._cashOutData.cashboxRecordReason.id}`);
    this._cashOutData.cashboxRecordReason = item;
    this._logHelper.trace(`CashboxRecordReason selected. New info: ${this._cashOutData.cashboxRecordReason.id}`);
  }

  currencySelected(item: Currency) {
    this._keyboardInternalService.CloseKeyBoard();
    this._logHelper.trace(`Currency selected. Previous info: ${this._cashOutData.currency.id}`);
    this._cashOutData.currency = item;
    this._logHelper.trace(`Currency selected. New info: ${this._cashOutData.currency.id}`);
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
  private fillAvailableCashRecordTypes() {
    this._getAvailableCashRecordReasonsByCashboxRecordTypeSubscription =
      this._cashboxService.getAvailableCashRecordReasonsByCashboxRecordType(CashboxRecordType.cashEntry)
      .first()
      .subscribe(result => {
        this.availableCashboxRecordReasons = result;
        if (this.availableCashboxRecordReasons != undefined &&
          this.availableCashboxRecordReasons.length > 0) {
          // Se selecciona uno de los CashRecordTypes obtenidos de forma predeterminada
          this._cashOutData.cashboxRecordReason = this.availableCashboxRecordReasons[0];
          // Se formatea el tamaño de los botones mostrados
          this.availableCashboxRecordReasonsButtonColumnWidthList =
            GenericHelper.generateButtonColumnWidthsList(12, 3, this.availableCashboxRecordReasons.length);
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

  getLiteral(group: string, key: string): string {
    return this._languageService.getLiteral(group, key);
  }

}
