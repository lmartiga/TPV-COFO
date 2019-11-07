import { Component, OnInit, HostBinding } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { Subject } from 'rxjs/Subject';

import { AppDataConfiguration } from 'app/config/app-data.config';
import { LogHelper } from 'app/helpers/log-helper';
import { CashboxClosureService } from 'app/services/cashbox-closure/cashbox-closure.service';
import { ConfirmActionService } from 'app/services/confirm-action/confirm-action.service';
import { DocumentInternalService } from 'app/services/document/document-internal.service';
import { KeyboardInternalService } from 'app/services/keyboard/keyboard-internal.service';
import { StatusBarService } from 'app/services/status-bar/status-bar.service';
import { CashboxClosureData } from 'app/shared/cashbox/cashbox-closure-data';
import { ConfirmActionType } from 'app/shared/confirmAction/confirm-action-type.enum';
import { Currency } from 'app/shared/currency/currency';
import { CurrencyCounter } from 'app/shared/currency/currency-counter';
import { IActionFinalizable } from 'app/shared/iaction-finalizable';
import { LanguageService } from 'app/services/language/language.service';
import { SignalRTMEService } from 'app/services/signalr/signalr-tme.service';
import { TMEApplicationInitResponseStatuses } from 'app/shared/hubble-pos-signalr-responses/tme-application-init-response-statuses.enum';
@Component({
  selector: 'tpv-cashbox-closure',
  templateUrl: './cashbox-closure.component.html',
  styleUrls: ['./cashbox-closure.component.scss']
})
export class CashboxClosureComponent implements OnInit, IActionFinalizable<boolean> {
  @HostBinding('class') class = 'tpv-cashbox-closure';

  // Evento de cierre caja ejecutado
  private _cashboxClosureExecuted: Subject<boolean> = new Subject();
  // El modelo bindeado al formulario tiene que existir (estar instanciado). Angular no lo instancia por nosotros
  private _cashboxClosureData: CashboxClosureData = { countedAmount: undefined, extractedAmount: undefined };

  private _requestingCashboxClosure: boolean = false;

  // Variables expuestas a HTML
  counter: CurrencyCounter;
  currentCurrency: Currency;

  // Literales expuestos a HTML
  headerLiteral: string;
  countedAmountLiteral: string;
  extractedAmountLiteral: string;
  submitLiteral: string;

  // Literales para mensajes genéricos al usuario
  errorHeaderLiteral: string;
  incompleteFormLiteral: string;

  // Literales para mensajes específicos
  cashboxClosureSucceedLiteral: string;
  cashboxClosureFailedLiteral: string;
  cashboxClosureGenericFailureLiteral: string;
  intentoTME = 0;
  // TME
  maxReintentosTME = 0;
  constructor(
    private _appDataConfig: AppDataConfiguration,
    private _documentInternalService: DocumentInternalService,
    private _cashboxClosureService: CashboxClosureService,
    private _statusBarService: StatusBarService,
    private _keyboardInternalService: KeyboardInternalService,
    private _confirmActionService: ConfirmActionService,
    private _languageService: LanguageService,
    private _signalRTMEService: SignalRTMEService,
    private _logHelper: LogHelper,
  ) {

    this.counter = this.fillDefaultCurrencyCounter();

    this.currentCurrency = this._appDataConfig.baseCurrency;
    this.fillDefaultFractionarySymbol();

    this.headerLiteral = this.getLiteral('cashbox_closure_component', 'header_CashClosure');
    this.countedAmountLiteral = this.getLiteral('cashbox_closure_component', 'literal_Cashclosure_CashInDrawer');
    this.extractedAmountLiteral = this.getLiteral('cashbox_closure_component', 'literal_Cashclosure_CashPulledOut');
    this.submitLiteral = this.getLiteral('cashbox_closure_component', 'bottomButton_CashClosure_OK');

    this.errorHeaderLiteral = this.getLiteral('cashbox_closure_component', 'header_CashClosure_ErrorPanel');
    this.incompleteFormLiteral = this.getLiteral('cashbox_closure_component', 'message_CashClosure_FormIncompleted');

    this.cashboxClosureSucceedLiteral = this.getLiteral('cashbox_closure_component', 'message_CashClosure_CashEntryMadeSuccessfully');
    this.cashboxClosureFailedLiteral = this.getLiteral('cashbox_closure_component', 'message_CashClosure_OperationFinishedKO');
    this.cashboxClosureGenericFailureLiteral = this.getLiteral('cashbox_closure_component', 'message_Cashclosure_CashEntryCouldNotBeFinished');
  }

  ngOnInit() {
    this._keyboardInternalService.CloseKeyBoard();


    const maxReintentosTMEConf = this._appDataConfig.getConfigurationParameterByName('MAX_REINTENTOS_CONEXION_TME', 'GENERAL');
    if (maxReintentosTMEConf != undefined) {
      this.maxReintentosTME = parseInt(maxReintentosTMEConf.meaningfulStringValue, 0);
    }
  }

  set cashboxClosureData(cashboxClosureData: CashboxClosureData) {
    this._cashboxClosureData = cashboxClosureData;
  }

  get cashboxClosureData() {
    return this._cashboxClosureData;
  }

  // Retransmite el evento de ejecución completada
  onFinish(): Observable<boolean> {
    return this._cashboxClosureExecuted.asObservable();
  }

  // Lanza el evento con resultado negativo ante un cierre forzoso
  forceFinish(): void {
    this._keyboardInternalService.CloseKeyBoard();
    this._cashboxClosureExecuted.next(false);
  }

  onSubmit() {
    if (this._requestingCashboxClosure === true) {
      return;
    }

    if (!this._signalRTMEService.getStatusConnection() && this.intentoTME < this.maxReintentosTME) {
      this._confirmActionService.promptActionConfirm(
        this.getLiteral('cashbox_closure_component', 'reconnect_TME'),
        this.getLiteral('options_components', 'confirmActionSvc.Yes'),
        this.getLiteral('options_components', 'confirmActionSvc.No'),
        this.getLiteral('options_components', 'confirmActionSvc.Confirm'),
        ConfirmActionType.Question)
        .subscribe(response => {
          if (response) {
            this.intentoTME++;
            Promise.resolve(this._signalRTMEService.startInitializationProcess()).then(responses => {
              if (responses.status === TMEApplicationInitResponseStatuses.successful) {
                this._signalRTMEService.setStatusConnection(true);
              } else if (responses.status === TMEApplicationInitResponseStatuses.genericError) {
                this._signalRTMEService.setStatusConnection(false);
              }
            });
          } else {
            this.cierreCaja();
          }
        });

    } else {
      this.cierreCaja();
    }
  }

  cierreCaja() {
    this._keyboardInternalService.CloseKeyBoard();
    if (this._documentInternalService.currentDocument != undefined &&
      this._documentInternalService.currentDocument.operator != undefined &&
      this._cashboxClosureData.countedAmount != undefined &&
      this._cashboxClosureData.extractedAmount != undefined) {

      this._requestingCashboxClosure = true;
      this._cashboxClosureService.closeCashbox(
        this._documentInternalService.currentDocument.operator,
        this._cashboxClosureData.countedAmount,
        this._cashboxClosureData.extractedAmount)
        .first()
        .subscribe(response => {
          this._requestingCashboxClosure = false;
          if (response == true) {
            this._logHelper.trace(this.cashboxClosureSucceedLiteral);
            this._statusBarService.publishMessage(this.cashboxClosureSucceedLiteral);
            this._cashboxClosureExecuted.next(true);
          } else {
            // Respuesta negativa
            this._logHelper.trace(this.cashboxClosureFailedLiteral);
            this._confirmActionService.promptActionConfirm(
              this.cashboxClosureFailedLiteral,
              this.submitLiteral,
              undefined,
              this.errorHeaderLiteral,
              ConfirmActionType.Error
            ).first().subscribe(r =>
              this._cashboxClosureExecuted.next(false)
            );
          }
        },
          error => {
            // Error genérico
            this._requestingCashboxClosure = false;
            this._logHelper.trace(`${this.cashboxClosureGenericFailureLiteral}: ${error.toString()}`);
            this._confirmActionService.promptActionConfirm(
              this.cashboxClosureGenericFailureLiteral,
              this.submitLiteral,
              undefined,
              this.errorHeaderLiteral,
              ConfirmActionType.Error
            ).first().subscribe(r =>
              this._cashboxClosureExecuted.next(false)
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
      ).first().subscribe(// r =>
        // no abortar
        // this._cashboxClosureExecuted.next(false)
      );
    }
  }

  onCountedAmountKeyEnterPressed() {
    // TODO: DE MOMENTO, NO HACER NADA CUANDO SE INTRODUZCA 'ENTER'
  }

  onExtractedAmountKeyEnterPressed() {
    // TODO: DE MOMENTO, NO HACER NADA CUANDO SE INTRODUZCA 'ENTER'
  }

  isRequestingCashboxClosure(): boolean {
    return this._requestingCashboxClosure;
  }

  // Genera un objeto CurrencyCounter vacío
  private fillDefaultCurrencyCounter(): CurrencyCounter {
    return {
      counted1c: 0,
      counted2c: 0,
      counted5c: 0,
      counted10c: 0,
      counted20c: 0,
      counted50c: 0,
      counted1: 0,
      counted2: 0,
      counted5: 0,
      counted10: 0,
      counted20: 0,
      counted50: 0,
      counted100: 0,
      counted200: 0,
      counted500: 0
    };
  }

  //  Cuando venga la información desde el webapi, no será necesario cambiar código aquí,
  // porque se rellena sólo si fractionarySymbol está vacío
  private fillDefaultFractionarySymbol() {
    if (this.currentCurrency != undefined &&
      this.currentCurrency.fractionarySymbol == undefined) {
      this.currentCurrency.fractionarySymbol = 'cent';
    }
  }

  getLiteral(group: string, key: string): string {
    return this._languageService.getLiteral(group, key);
  }
}
