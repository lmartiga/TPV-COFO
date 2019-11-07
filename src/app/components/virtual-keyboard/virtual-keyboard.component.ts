import { Component, OnInit, ElementRef/*EventEmitter*/, HostBinding, Renderer, OnDestroy } from '@angular/core';
import { KeyboardInternalService } from 'app/services/keyboard/keyboard-internal.service';
import { NgModel } from '@angular/forms/src/directives/ng_model';
import { KeyboardClassKey } from 'app/shared/Keyboard/Keyboard.key.enum';
import { isNullOrUndefined } from 'util';
import { LanguageService } from 'app/services/language/language.service';
import { Subscription } from 'rxjs/Subscription';
import { LogHelper } from 'app/helpers/log-helper';

@Component({
  selector: 'tpv-virtual-keyboard',
  templateUrl: './virtual-keyboard.component.html',
  styleUrls: ['./virtual-keyboard.component.scss']
})

export class VirtualKeyboardComponent implements OnInit, OnDestroy {

  value: string;
  alfKeys: Array<String>;
  numKeys: Array<String>;
  disabledPosition: string[][] = [];
  mayusculas: boolean;
  model: NgModel;
  element: ElementRef;
  position: number;
  isNumber: boolean;
  renderer: Renderer;
  inputValue: string;
  key: string;
  pressed: boolean = false;
  maxlength: number = 16;
  posicionInicial: number;
  private _subscriptions: Subscription[] = [];
  @HostBinding('class') class = 'virtual-keyboard';

  constructor(
    private keyboardInternalSvc: KeyboardInternalService,
    private _languageService: LanguageService,
    private  _logHelper: LogHelper
  ) { }

  ngOnInit() {
    this.value = '';
    this.alfKeys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-',
      'q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p',
      'a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', 'ñ',
      '@', 'z', 'x', 'c', 'v', 'b', 'n', 'm', ',', '.'];

    this.numKeys = ['1', '2', '3',
      '4', '5', '6',
      '7', '8', '9',
      '', '0', '.'];

    this.disabledPosition[1] = ['3', '4', '5', '6', '7', '8', '9'];
    this.disabledPosition[2] = ['4', '5', '6', '7', '8', '9'];
    this.disabledPosition[3] = ['6', '7', '8', '9'];

    this.mayusculas = true;

    // recibo el ngmodel
    try {
      this._subscriptions.push(this.keyboardInternalSvc.sendNgModel$.subscribe(model => {
        if (model) {
          this.model = model;
        } else {
          this._logHelper.trace('no se ha recibido el ngmodel');
        }
      }));
    } catch (error) {
      this._logHelper.trace(error);
    }

    // recibo el elementRef
    try {
      this._subscriptions.push(this.keyboardInternalSvc.sendElementRef$.subscribe(element => {
        if (element) {
          this.element = element;
        } else {
          this._logHelper.trace('no se ha recibido el ngmodel');
        }
      }));
    } catch (error) {
      this._logHelper.trace(error);
    }

    // recibo el la posición del puntero dentro del input
    try {
      this._subscriptions.push(this.keyboardInternalSvc.sendPosition$.subscribe(position => {
        this.position = position;
      }));
    } catch (err) {
      this._logHelper.trace(err);
    }

    this._subscriptions.push(this.keyboardInternalSvc.posicionInicial$.subscribe(position => {
      this.posicionInicial = position;
    }));
    // recibo el type del input
    this._subscriptions.push(this.keyboardInternalSvc.sendType$.subscribe(type => {
      const tipo = type.split('-');
      if (tipo[0] == 'number' || tipo[0] == 'time') {
        this.isNumber = true;
      } else if (tipo.length > 1) {
        if (tipo[0] == 'text' && tipo[1].length > 0) {
          this.isNumber = true;
        } else {
          this.isNumber = false;
        }
        // this.value = '';
      } else {
        this.isNumber = false;
      }
      jQuery('#valueKeyboard').attr('type', tipo[0]);
    }));

    this._subscriptions.push(this.keyboardInternalSvc.twoPoints$.subscribe(twoPoints => {
      if (twoPoints) {
        this.numKeys[11] = this.numKeys[11].replace('.', ':');
      } else {
        this.numKeys[11] = this.numKeys[11].replace(':', '.');
      }
    }));
    // recibo el ngmodel
    try {
      this._subscriptions.push(this.keyboardInternalSvc.keyInputValue$.subscribe(value => {
        if (value != undefined) {
          this.inputValue = value;
        } else {
          this._logHelper.trace('no se ha recibido el ngmodel');
        }
      }));
    } catch (error) {
      this._logHelper.trace(error);
    }

    this._subscriptions.push(this.keyboardInternalSvc.showKeyBoard$.subscribe(value => {
      this.showTextVirtualkeyboard(value);
    }));

    this._subscriptions.push(this.keyboardInternalSvc.key$.subscribe((value: any) => {
      if (value != undefined) {
        this.key = value;
        if (this.model != undefined) {
          this.fnEventKeyDown(value, this.isNumber, true);
        } else {
          this.fnEventKeyDown(value, this.isNumber, false);
        }
      }
    }));

    this._subscriptions.push(this.keyboardInternalSvc.keyup$.subscribe((value: any) => {
      if (value != undefined) {
        this.key = value;
        this.pressed = false;
      }
    }));

    this._subscriptions.push(this.keyboardInternalSvc.MaxLength$.subscribe(value => {
      this.maxlength = value == undefined ? this.maxlength : Number(value);
    }));
  }

  ngOnDestroy() {
    this._subscriptions.forEach(s => s.unsubscribe());
  }

  fnEventKeyDown(keyValue: any, isTypeNumber: boolean, isModel: boolean) {
    let blnValidar: boolean;
    switch (keyValue) {
      // this keys have no actions yet
      // TODO: add deadkeys and modifiers
      case KeyboardClassKey.Alt:
      case KeyboardClassKey.AltGraph:
      case KeyboardClassKey.AltLk:
      case KeyboardClassKey.Backspace:
        this.pressed = true;
        this.delete(isModel);
        break;
      case KeyboardClassKey.CapsLock:
        this.pressed = true;
        this.mayus();
        break;
      case KeyboardClassKey.Enter:
        this.pressed = true;
        break;
      case KeyboardClassKey.Shift:
      case KeyboardClassKey.Tab:
      case KeyboardClassKey.Space:
        this.pressed = true;
        break;
      default:
        if (isTypeNumber) {
          this.numKeys.filter((key: string) => key === keyValue)
            .forEach((key: string) => { blnValidar = true; });
          if (blnValidar) {
            this.pressed = true;
            this.addValue(keyValue, isModel);
          }
        }
        else {
          this.alfKeys.filter((key: string) => key.toUpperCase() === keyValue.toUpperCase())
            .forEach((key: string) => { blnValidar = true; });
          if (blnValidar) {
            this.pressed = true;
            this.addValue(keyValue, isModel);
          }
        }
        break;
    }
  }

  // añado un caracter al input
  addValue(value: string, blnkeydown: boolean = true) {
    let valor: string;
    let modelValue = this.inputValue;
    if (!blnkeydown) {
      if (this.position && this.position !== 0) {
        // construyo el valor a escribir en el input
        const first = modelValue.slice(0, this.position);
        const second = modelValue.slice(this.position);
        valor = first + value + second;

      } else if (this.position === 0) {
        valor = value + modelValue;

      } else {
        valor = modelValue + value;
      }
      this.value = valor;
    }
    else {
      let inputText: string;

      if (this.model != undefined) {
        if (isNaN(this.model.value) && this.isNumber) {
          inputText = String(this.inputValue == undefined ? '' : this.inputValue);
        } else if (this.model.value == undefined || this.model.value == '') {
          inputText = String(this.inputValue == undefined ? '' : this.inputValue);
        } else {
          inputText = String(this.model.value);
        }
      } else {
        inputText = String(this.inputValue == undefined ? '' : this.inputValue);
      }


      // si el type es number lo pongo como text
      if (this.isNumber) {
        if (this.element != undefined) {
          this.element.nativeElement.type = this.element.nativeElement.type === 'time' ? 'time' : 'text';
          if (inputText != undefined) {
            if (inputText.length <= this.maxlength) {
              if (inputText.length == this.maxlength) {
                valor = inputText.substring(0, this.maxlength);
              } else {
                valor = inputText;
              }
            } else if (inputText.length > this.maxlength) {
              valor = inputText.substring(0, this.maxlength);
              this.value = valor;
              return;
            }
          }
        }
      }

      // compruebo que haya un valor en el input
      let inputValue;
      if (this.isNumber && inputText == '') {
        inputValue = undefined;
      } else {
        inputValue = inputText;
      }
      if (inputValue == undefined) {
        if (this.element != undefined) {
          if (this.element.nativeElement.type !== 'time') {
            this.position = undefined;
          }
        }
        valor = value;
        if (this.element != undefined) {
          if (this.element.nativeElement.type === 'time') {
            valor = this.GetDateFormat(this.element.nativeElement.value, value);
          }
        }
      } else {
        modelValue = inputText + '';

        // si se ha selecionado una porción del texto
        let element = 0;
        if (this.element) {
          element = this.element.nativeElement.selectionEnd;
        }
        if (element != 0) {
          const first = modelValue.slice(0, this.element.nativeElement.selectionStart);
          const second = modelValue.slice(this.element.nativeElement.selectionEnd, modelValue.length);
          valor = (first === '' && second === '') ? value : first + value + second;
          if (this.element.nativeElement.type === 'time') {
            valor = this.GetDateFormat(this.element.nativeElement.value, value);
          }
          this.position = valor.length;
        } else if (this.position && this.position !== 0) {
          // construyo el valor a escribir en el input
          const first = modelValue.slice(0, this.position);
          const second = modelValue.slice(this.position);
          valor = first + value + second;
          this.position++;
        } else if (this.position === 0) {
          valor = value + modelValue;
          this.position++;
        } else {
          valor = modelValue + value;
        }
      }
      if (this.pressed) {
        this.value = valor;
        return;
      }
      let inputValueToCheckType: any;
      // si no acaba en punto o 0 y que el input sea un número
      if (valor[valor.length - 1] != '.' &&
        valor[valor.length - 1] != '0' &&
        valor[valor.length - 1] != '-' &&
        this.isNumber) {
        inputValueToCheckType = parseFloat(valor);
      } else {
        const numOfPointsInTheString = valor.split('.').length - 1;
        if (numOfPointsInTheString > 1 && this.isNumber) {
          return;
        } else {
          // this.simulateKeyboardPress(valor);
        }
      }

      if (inputValueToCheckType != undefined && this.isNumber) {
        if (this.element != undefined) {
          this.element.nativeElement.type = this.element.nativeElement.type === 'time' ? 'time' : 'number';
        }
        // this.simulateKeyboardPress(inputValueToCheckType);
      } else {
        if (!this.isNumber) {
          // this.simulateKeyboardPress(valor);
        }
      }
      if (this.model == undefined) {
        this.keyboardInternalSvc.SendValue(value);
      }

      if (valor[valor.length - 1] == '.') {
        if (this.model !== undefined) {
          setTimeout(() => this.model.control.setErrors({ 'required': true }));
        }
      }
      // Cuando teníamos seleccionado el texto y este era igual al
      // caracter que introducíamos se quedaba pillado.
      // Para que no pase hacemos esto:
      if (this.value == valor) {
        (async () => {
          this.simulateKeyboardPress('');
          await this.delay_promise(5);
          this.simulateKeyboardPress(valor);
        })();
      } else {
        this.simulateKeyboardPress(valor);
      }
      if (this.model != undefined || valor.length < 2) {
        this.value = valor;
      }
    }
  }

  /**
  * Método para aplicar un tiempo de espera
  * @param ms tiempo de espera en milisegundos
  */
  delay_promise(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  ActivedAllButton() {
    for (let index = 1; index <= 9; index++) {
      const div: Element = document.querySelector('.key-' + index);
      if (div !== undefined && div !== null) {
        const button = div.children[0];

        if (button !== undefined && button !== null) {
          button.removeAttribute('Disabled');
        }
      }
    }
  }

  DisabledButton(position: string) {
    const div: Element = document.querySelector('.key-' + position);
    if (div !== undefined && div !== null) {
      const button = div.children[0];
      if (button !== undefined && button !== null) {
        button.setAttribute('Disabled', 'true');
      }
    }
  }

  SetStatusButton(value: string) {
    switch (this.position) {
      case 1:
        this.disabledPosition[1].forEach(disa => {
          this.DisabledButton(disa);
        });
        break;
      case 2:
        if (value[0] !== '1' && value[0] !== '0') {
          this.disabledPosition[2].forEach(disa => {
            this.DisabledButton(disa);
          });
        }
        break;
      case 3:
        this.disabledPosition[3].forEach(disa => {
          this.DisabledButton(disa);
        });
        break;
      default:
        break;
    }
  }

  GetDateFormat(value: string, newValue: string, sumar: boolean = true): string {
    const v = value.replace(':', '').substring(0, 4);
    let result = '00:00';

    this.ActivedAllButton();

    switch (this.position) {
      case 0:
        result = '00:00';
        break;
      case 1:
        result = newValue + '0:00';
        break;
      case 2:
        result = v[0] + newValue + ':00';
        break;
      case 3:
        result = v[0] + v[1] + ':' + newValue + '0';
        break;
      case 4:
      case 5:
        result = v[0] + v[1] + ':' + v[2] + newValue;
        break;
      default:
        result = '00:00';
        break;
    }

    if (this.position <= 4 && sumar) {
      this.position++;
    }

    this.SetStatusButton(result.replace(':', ''));

    return result;
  }

  // al presionar el boton enter
  intro() {
    this.keyboardInternalSvc.CloseKeyBoard();


    const event = document.createEvent('Event');
    event.initEvent('enter', false, true);
    if (this.element != undefined) {
      this.element.nativeElement.dispatchEvent(event);
    }

    // cambio el tipo del input a number de nuevo
    if (this.isNumber) {
      if (this.element != undefined) {
      this.element.nativeElement.type = this.element.nativeElement.type === 'time' ? 'time' : 'number';
      }
    }
    this.value = '';
    if (this.model) {
      this.model.update.emit(this.value);
    }
  }

  simulateKeyboardPress(value: any) {
    if (this.element != undefined) {
      (this.element.nativeElement as HTMLElement).focus();
    }
    if (this.model != undefined) {
      this.model.update.emit(value);
    }
    jQuery('.cdk-overlay-container').detach().insertAfter('.virtual-keyboard');
  }


  close() {
    this.keyboardInternalSvc.CloseKeyBoard();
    // cambio el tipo del input a number de nuevo
    if (this.isNumber) {
      if (this.element != undefined) {
      this.element.nativeElement.type = this.element.nativeElement.type === 'time' ? 'time' : 'number';
      }
    }
    this.value = '';
    // this.model.update.emit(this.value);
    this.keyboardInternalSvc.SendValue('close');
  }

  delete(blnkeydown: boolean = true) {
    let inputText, valueTime;
    if (this.model != undefined) {
      if (this.model.value == undefined || this.model.value == '') {
        inputText = this.inputValue;
      } else {
        inputText = this.model.value;
      }
    } else {
      inputText = this.inputValue;
    }
    if (this.element != undefined) {
      if (this.element.nativeElement.type === 'time' && this.position > 1) {
        this.position--;
        valueTime = JSON.parse(JSON.stringify(this.value));
      }
    }

    // si el type es number lo pongo como text
    if (this.isNumber) {
      if (this.element != undefined) {
        this.element.nativeElement.type = this.element.nativeElement.type === 'time' ? 'time' : 'text';
      }
      if (this.value != undefined) {
        if (this.value.length <= 0) {
          return;
        }
      }
    }
    // si se ha selecionado una porción del texto
    let selectionEnd = 0;
    let selectionStart = 0;
    if (this.element != undefined) {
      if (this.element.nativeElement.type !== 'time') {
        selectionEnd = this.element.nativeElement.selectionEnd;
        selectionStart = this.element.nativeElement.selectionStart;
        this.position = this.element.nativeElement.selectionEnd;
      }
    }
    if (this.value.indexOf('.') && selectionEnd == 0) {
      if (this.element != undefined) {
        if (this.element.nativeElement.type !== 'time') {
          selectionEnd = this.value.length;
          selectionStart = selectionEnd;
          this.position = selectionEnd;
        }
      }
    }
    if (selectionEnd != selectionStart) {
      if (this.element != undefined) {
        if (this.element.nativeElement.type !== 'time') {
          const value: string = inputText.toString();
          const first = value.slice(0, selectionStart);
          const second = value.slice(selectionEnd, inputText.length);
          this.value = first + second;
          this.position = this.value.length;
        }
      }
    } else if (this.position) {
      // construyo el valor a escribir en el input
      const first = inputText.toString().slice(0, this.position);
      const second = inputText.toString().slice(this.position);
      this.value = first.slice(0, -1) + second;
      if (this.element != undefined) {
        if (this.element.nativeElement.type !== 'time') {
          this.position--;
        } else {
          this.value = this.GetDateFormat(valueTime, '0', false);
        }
     }
    } else {
      if (inputText == undefined) {
        this.value = '';
      } else {
        this.value = inputText.toString().slice(0, -1);
      }
    }
    if (this.pressed) {
      return;
    }
    let inputValueToCheckType: any;
    if (this.value[this.value.length - 1] != '.' && this.value[this.value.length - 1] != '0') {
      if (this.value != undefined || this.value != '') {
        inputValueToCheckType = parseFloat(this.value);
      }
      inputValueToCheckType = this.value;
    }

    if (inputValueToCheckType !== undefined && this.isNumber) {
      if (this.element != undefined) {
        this.element.nativeElement.type = this.element.nativeElement.type === 'time' ? 'time' : 'text';
      }
      if (!this.pressed) {
        this.simulateKeyboardPress(inputValueToCheckType);
      }
    } else {
      if (!this.pressed) {
        this.simulateKeyboardPress(this.value);
      }
    }

    if (this.value.length < 1 || this.value[this.value.length - 1] == '.') {
      if (this.model !== undefined) {
      setTimeout(() => this.model.control.setErrors({ 'required': true }));
      }
    }
    if (blnkeydown) {
      this.keyboardInternalSvc.SendValue('delete');
    }
  }

  mayus() {
    if (this.mayusculas) {
      this.alfKeys = this.alfKeys.map(letra => letra.toLocaleUpperCase());
      this.mayusculas = !this.mayusculas;
    } else {
      this.alfKeys = this.alfKeys.map(letra => letra.toLocaleLowerCase());
      this.mayusculas = !this.mayusculas;
    }
  }

  formatNumber(input?: any): number {
    if (input) {
      return Number(input);
    } else {
      return undefined;
    }
  }

  showTextVirtualkeyboard(value: any) {
    if (!value) {
      this.model = undefined;
      this.value = '';
      this.inputValue = '';
    } else {
      this._subscriptions.push(this.keyboardInternalSvc.sendNgModel$.subscribe(model => {
        if (model) {
          if (model.value != undefined) {
            if (Number.isNaN(model.value)) {
              this.value = '';
              this.inputValue = '';
              return;
            } else {
              this.value = model.value;
              return;
            }
          }
        }
      }));
      if (this.inputValue != undefined || this.inputValue != '') {
        if (this.isNumber) {
          if (this.element) {
            this.element.nativeElement.type = this.element.nativeElement.type === 'time' ? 'time' : 'text';
          }
        }
        this.value = this.inputValue;
        return;
      }
      this.value = '';
    }
  }

  MostrarKeyboard(event: MouseEvent) {
    event.preventDefault();
  }


  IsDisabled(key: string): boolean {
    // if (!this.disabledPosition) {
    //   return false;
    // }
    // return this.disabledPosition[this.position].find(x => x === key).length > 0;
    if (this.element != undefined) {
      if (this.element.nativeElement.type === 'time') {
        return this.position % 2 === 0;
      }
    }
    return false;
  }


  isPresed(key: string): boolean {
    if (this.pressed && this.key === key) {
      return true;
    } else { return false; }
  }

  enterOut() {
    this.keyboardInternalSvc.CloseKeyBoard();
    const event = document.createEvent('Event');
    event.initEvent('enter', false, true);

    if (!isNullOrUndefined(this.element)) {
      this.element.nativeElement.dispatchEvent(event);

      // cambio el tipo del input a number de nuevo
      if (this.isNumber) {
        this.element.nativeElement.type = this.element.nativeElement.type === 'time' ? 'time' : 'number';
      }
    }
    // this.value = '';
    if (this.model) {
      this.model.update.emit(this.value);
    }
    else {
      this.keyboardInternalSvc.SendValue('enter');
    }
  }

  getLiteral(group: string, key: string): string {
    return this._languageService.getLiteral(group, key);
  }
}
