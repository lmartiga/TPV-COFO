import { Component, OnInit, HostBinding } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { Subject } from 'rxjs/Subject';

import { AppDataConfiguration } from 'app/config/app-data.config';
import { LogHelper } from 'app/helpers/log-helper';
import { ConfirmActionService } from 'app/services/confirm-action/confirm-action.service';
import { DocumentInternalService } from 'app/services/document/document-internal.service';
import { KeyboardInternalService } from 'app/services/keyboard/keyboard-internal.service';
import { StatusBarService } from 'app/services/status-bar/status-bar.service';
import { ConfirmActionType } from 'app/shared/confirmAction/confirm-action-type.enum';
import { Currency } from 'app/shared/currency/currency';
import { CurrencyCounter } from 'app/shared/currency/currency-counter';
import { IActionFinalizable } from 'app/shared/iaction-finalizable';
import { CashboxClosureDataOffline } from '../../shared/shared-cierre-diferido/cashbox-closure-offline-data';
import { CashboxClosureServiceOffline } from '../../services/cashbox-closure-offline-services/cashbox-closure-offline.service';
import { LanguageService } from 'app/services/language/language.service';

@Component({
  selector: 'tpv-cashbox-closure-offline',
  templateUrl: './cashbox-closure-offline.component.html',
  styleUrls: ['./cashbox-closure-offline.component.scss']
})
export class CashboxClosureOfflineComponent implements OnInit, IActionFinalizable<boolean> {
  @HostBinding('class') class = 'tpv-cashbox-closure-offline';

  // Evento de cierre caja ejecutado
  private _cashboxClosureExecuted: Subject<boolean> = new Subject();
  // El modelo bindeado al formulario tiene que existir (estar instanciado). Angular no lo instancia por nosotros
  private _cashboxClosureData: CashboxClosureDataOffline = { countedAmount: undefined, extractedAmount: undefined };

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

  constructor(
    private _appDataConfig: AppDataConfiguration,
    private _documentInternalService: DocumentInternalService,
    private _cashboxClosureServiceOffline: CashboxClosureServiceOffline,
    private _statusBarService: StatusBarService,
    private _keyboardInternalService: KeyboardInternalService,
    private _confirmActionService: ConfirmActionService,
    private _languageService: LanguageService,
    private _logHelper: LogHelper,
    ) {

      this.counter = this.fillDefaultCurrencyCounter();

      this.currentCurrency = this._appDataConfig.baseCurrency;
      this.fillDefaultFractionarySymbol();

      this.headerLiteral = this.getLiteral('cashbox_closure_offline_component', 'literal_header_closing_offline_box');
      this.countedAmountLiteral = this.getLiteral('cashbox_closure_offline_component', 'literal_counted_amount');
      this.extractedAmountLiteral = this.getLiteral('cashbox_closure_offline_component', 'literal_metal_closing_exit');
      this.submitLiteral = this.getLiteral('cashbox_closure_offline_component', 'literal_accept');

      this.errorHeaderLiteral = this.getLiteral('cash_out_offline_component', 'literal_mistake');
      this.incompleteFormLiteral = this.getLiteral('cashbox_closure_component', 'message_CashClosure_FormIncompleted');

      this.cashboxClosureSucceedLiteral = this.getLiteral('cashbox_closure_offline_component', 'cashbox_executed_correctly');
      this.cashboxClosureFailedLiteral = this.getLiteral('cashbox_closure_offline_component', 'cashbox_closure_failed_literal');
      this.cashboxClosureGenericFailureLiteral = this.getLiteral('cashbox_closure_offline_component', 'cashbox_closure_generic_failure');
  }

  ngOnInit() {
    this._keyboardInternalService.CloseKeyBoard();
  }
  getLiteral(group: string, key: string): string {
    return this._languageService.getLiteral(group, key);
  }
  set cashboxClosureData(cashboxClosureData: CashboxClosureDataOffline) {
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
    this._keyboardInternalService.CloseKeyBoard();
    if (this._documentInternalService != undefined &&
        this._documentInternalService.currentDocument.operator != undefined &&
        this._cashboxClosureData.countedAmount != undefined &&
        this._cashboxClosureData.extractedAmount != undefined) {
      this._cashboxClosureServiceOffline.closeCashboxOffline(
        this._documentInternalService.currentDocument.operator,
        this._cashboxClosureData.countedAmount,
        this._cashboxClosureData.extractedAmount)
        .first()
        .subscribe(response => {
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
      counted500: 0};
  }

  //  Cuando venga la información desde el webapi, no será necesario cambiar código aquí,
  // porque se rellena sólo si fractionarySymbol está vacío
  private fillDefaultFractionarySymbol() {
    if (this.currentCurrency != undefined &&
        this.currentCurrency.fractionarySymbol == undefined) {
      this.currentCurrency.fractionarySymbol = 'cent';
    }
  }
}
