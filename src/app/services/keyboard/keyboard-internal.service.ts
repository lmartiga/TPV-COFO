import { Injectable, ElementRef } from '@angular/core';
import { Subject } from 'rxjs/Subject';
import { NgModel } from '@angular/forms';

// NOTA: de momento se lanzan eventos clicks en los INPUTS de los que se quiere que el teclado aparezca
// sin embargo, quizás sea mejor en una reingeniería que el teclado sea enriquezido de forma que se le diga
// que elemento del DOMS ha de ponerse el foco.
@Injectable()
export class KeyboardInternalService {
  // Enviar la referencia del elemento
  private _sendValue: Subject<string> = new Subject();
  keyValue$ = this._sendValue.asObservable();

  // Enviar la referencia del value del input
  private _sendInputValue: Subject<string> = new Subject();
  keyInputValue$ = this._sendInputValue.asObservable();


  // envio el type del input
  private _sendType: Subject<string> = new Subject();
  sendType$ = this._sendType.asObservable();

  // Mostrar el keyboard en la pantalla
  private _showKeyboard: Subject<boolean> = new Subject();
  showKeyBoard$ = this._showKeyboard.asObservable();

  // enviar el  ngmodel
  private _sendNgModel: Subject<NgModel> = new Subject();
  sendNgModel$ = this._sendNgModel.asObservable();

  // envia el elementRef
  private _sendElementRef: Subject<ElementRef> = new Subject();
  sendElementRef$ = this._sendElementRef.asObservable();

  // enviar la posicion del puntero dentro del input
  private _sendPosition: Subject<number> = new Subject();
  sendPosition$ = this._sendPosition.asObservable();


  private _twoPoints: Subject<boolean> = new Subject();
  twoPoints$ = this._twoPoints.asObservable();

  private _key: Subject<string> = new Subject();
  key$ = this._key.asObservable();

  private _keyup: Subject<string> = new Subject();
  keyup$ = this._keyup.asObservable();

  private _MaxLength: Subject<string> = new Subject();
  MaxLength$ = this._MaxLength.asObservable();

  private _posicionInicial: Subject<number> = new Subject();
  posicionInicial$ = this._posicionInicial.asObservable();

  private _Barcode: Subject<string> = new Subject();
  Barcode$ = this._Barcode.asObservable();
  constructor(
  ) {
  }

  // Envio la referencia del elemento y abro el keyboard
  ShowKeyBoard() {
    this._showKeyboard.next(true);
  }
  // Cierro el keyboard
  CloseKeyBoard() {
    this._showKeyboard.next(false);
  }
  // Enviar el valor
  SendValue(value: string) {
    this._sendValue.next(value);
  }

  // Enviar el input value
  SendInputValue(value: string) {
    this._sendInputValue.next(value);
  }

  // Envio el typo
  SendType(type: string) {
    this._sendType.next(type);
  }

  // envio el ngModel del input
  SendNgModel(model: NgModel) {
    this._sendNgModel.next(model);
  }

  // envio el ElementRef del input
  SendElementRef(elem: ElementRef) {
    this._sendElementRef.next(elem);
  }
  // la posicion del puntero dentro de la cadena
  SendPosition(position: number) {
    this._sendPosition.next(position);
  }

  ShowTwoPoints(twoPoints: boolean) {
    this._twoPoints.next(twoPoints);
  }

  ShowEventKeyPress(value: string) {
    this._key.next(value);
  }

  ShowEventKeyUp(value: string) {
    this._keyup.next(value);
  }
  SendMaxLength(value: string){
    this._MaxLength.next(value);
  }
  SendPosicionInicial(value: number){
    this._posicionInicial.next(value);
  }
  SendBarcode(value: string){
    this._Barcode.next(value);
  }
}
