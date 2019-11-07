import { Component, OnInit, Input, OnDestroy } from '@angular/core';
import { ChangePaymentInternalService } from 'app/services/payments/change-payment-internal.service';
import { buttonStatus } from 'app/shared/button-status.enum';
import { Subscription } from 'rxjs/Subscription';
import { FuellingLimit } from 'app/shared/fuelling-point/fuelling-limit';
import { keyboardstatic } from 'app/shared/Keyboard/keyboard-static';
import { SessionInternalService } from 'app/services/session/session-internal.service';
import { LanguageService } from 'app/services/language/language.service';


@Component({
  selector: 'tpv-static-keyboard',
  templateUrl: './static-keyboard.component.html',
  styleUrls: ['./static-keyboard.component.scss']
})
export class StaticKeyboardComponent implements OnInit, OnDestroy {
  @Input() textToShow: string;
  @Input() sizeNumbers: boolean;
  placeholderToShow: string;
  numKeys: Array<{number: string, class: string}>;
  value: string;
  tipo: number;
  isPassword: boolean;
  FuellingLimit: FuellingLimit = {
    type: 0,
    value: 0
  };
  totalChangedDelivered: number = 0;
  input: any;
  pendiente: number = 0;
  messageAccion: string = this.getLiteral('static_keyboard','messageAccion');
  messajeErrorDeuda: string = this.getLiteral('static_keyboard','messageErrorDeuda');
  private _subscriptions: Subscription[] = [];
  element: any;
  ResponseKeyboard: keyboardstatic = {
    tipo: 0,
    value: undefined,
    intro: undefined
  };
  disabledBtnAcep: boolean = false;

  constructor(
    private _changeDelivered: ChangePaymentInternalService,
    private _changedPaymnetInternalSvc: ChangePaymentInternalService,
    private _session: SessionInternalService,
    private _languageService: LanguageService
    ) {
  }

  ngOnInit() {
    this.disabledBtnAcep = false;
    this.placeholderToShow = (this.textToShow != undefined && this.textToShow != '') ?
     this.textToShow : this.getLiteral('static_keyboard', 'Other_Amount');

    this.numKeys = [
      { number: '1', class: 'borderRightBottom' }, { number: '2', class: 'borderRightBottom' }, { number: '3', class: 'borderBottom' },
      { number: '4', class: 'borderRightBottom' }, { number: '5', class: 'borderRightBottom' }, { number: '6', class: 'borderBottom' },
      { number: '7', class: 'borderRightBottom' }, { number: '8', class: 'borderRightBottom' }, { number: '9', class: 'borderBottom' },
      { number: '', class: 'borderRight' }, { number: '0', class: 'borderRight' }, { number: '.', class: 'noBorderButton' },
    ];

    this._subscriptions.push(this._changedPaymnetInternalSvc.FuellingLimit$.subscribe(d => {
      this.value =  d.value.toString()  == '0' ? undefined : d.value.toString();
      this.FuellingLimit.value = d.value;
      this.FuellingLimit.type = d.type;
    }));

    this._subscriptions.push(this._session.cleanKeyboardSession$.subscribe(d => {
      this.value = d.value.toString();
      this.element = d.value;
      this.tipo = d.tipo;
      this.isPassword = d.isPassword;
    }));

    this._subscriptions.push(this._changedPaymnetInternalSvc.KeyboardStatic$.subscribe(d => {
      this.input = d.value.name + '-' + d.value.value;
      this.value = d.value.value.toString();
      this.element = d.value;
      this.tipo = d.tipo;
    }));
  }

  ngOnDestroy(): void {
    this._subscriptions.forEach(s => s.unsubscribe());
  }
  addValue(value: string, clear: boolean) {

    this._changeDelivered.fnButtonDisable(buttonStatus.ENABLED);

    if (!this.value) {
      this.value = '';
    }
    if (clear) {
      this.value = value;
    } else {
      const currentValor = this.value;
      const position = this.value.length;
      if (position && position !== 0) {
        // construyo el valor a escribir en el input
        const first = currentValor.slice(0, position);
        const second = currentValor.slice(position);
        this.value = first + value + second;

      } else if (!position) {
        this.value = value + currentValor;
      }
    }
    let selectionEnd = 0;
    let selectionStart = 0;
    if ( this.element != undefined ) {
      selectionEnd = this.element.selectionEnd;
      selectionStart = this.element.selectionStart;
    }
    if (selectionEnd != selectionStart) {
      const getValue: string = this.value.toString();
      const first = getValue.slice(0, selectionStart);
      const second = getValue.slice(selectionEnd, this.value.length);
      this.value = first + second;
    }
    if (this.input != undefined) {
      const input = this.input.split('-');
      this.input = input[0] + '-' + this.value;
    } else {
      this.input = '';
    }
    this.ResponseKeyboard.value = this.input;
    if ( this.element != undefined ) {
      if (this.element.selectionEnd !== undefined) {
        this.element.selectionEnd = 0;
      }
    }
    this.ResponseKeyboard.tipo = this.tipo;
    this._changeDelivered.fnkeyboardResponse(this.ResponseKeyboard);
  }
  delete() {
    const currentValor = this.value;
    if (this.value != '') {
      this.value = currentValor.slice(0, -1);
    }
    if (this.value == '') {
      this.pendiente = 0;
      this._changeDelivered.fnButtonDisable(buttonStatus.DISABLED);
    }
    const input = this.input.split('-');
    this.input = input[0] + '-' + this.value;
    this.ResponseKeyboard.value = this.input;
    this.ResponseKeyboard.tipo = this.tipo;
    this._changeDelivered.fnkeyboardResponse(this.ResponseKeyboard);
  }
  intro() {
    if (this.tipo == 1) {
      const ResponseKeyboard: keyboardstatic = {
        tipo: this.tipo,
        value: undefined,
        intro: 'enter'
      };
      this._changeDelivered.fnkeyboardResponse(ResponseKeyboard);
    } else if (this.tipo == 3) {
      const responseKeyboard: keyboardstatic = {
        tipo: this.tipo,
        value: Number(this.value),
        intro: 'enter'
      };
      this._session.fnSetValueKeyboardSession(responseKeyboard);
    }
    else if (this.tipo == 4) {
      const responseKeyboard: keyboardstatic = {
        tipo: this.tipo,
        value: this.value,
        intro: 'enter'
      };
      this._session.fnSetValueKeyboardSession(responseKeyboard);
    } else {
      if (this.value !== undefined) {
      this.disabledBtnAcep = true;
      this.FuellingLimit.value = Number(this.value);
      this._changeDelivered.fnFuellingLimitResponse(this.FuellingLimit);
      }
    }
  }
  disableButon() {
    return Number(this.value) < 1;
  }
  getLiteral(group: string, key: string): string {
    return this._languageService.getLiteral(group, key);
  }
}
