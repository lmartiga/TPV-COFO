import { Injectable } from '@angular/core';
import { Subject } from 'rxjs/Subject';
import { changedPayment } from 'app/shared/payments/changed-payment';
import { Document } from 'app/shared/document/document';
import { FuellingLimit } from 'app/shared/fuelling-point/fuelling-limit';
import { keyboardstatic } from 'app/shared/Keyboard/keyboard-static';

@Injectable()
export class ChangePaymentInternalService {

  _changedPayment: Subject<changedPayment> = new Subject<changedPayment>();
  changedPayment$ = this._changedPayment.asObservable();
  _changedPaymentFail: Subject<changedPayment> = new Subject<changedPayment>();
  changedPaymentFail$ = this._changedPaymentFail.asObservable();
  _buttonDisable: Subject<number> = new Subject<number>();
  _buttonDisable$ = this._buttonDisable.asObservable();
  /*
  _timerTicket: Subject<boolean> = new Subject<boolean>();
  timerTicket$ = this._timerTicket.asObservable();
  */
  _document: Subject<Document> = new Subject<Document>();
  document$ = this._document.asObservable();
  _resetDocument: Subject<boolean> = new Subject<boolean>();
  resetDocument$ = this._resetDocument.asObservable();
  _responseFidelizacion: Subject<boolean> = new Subject<boolean>();
  responseFidelizacion$ = this._responseFidelizacion.asObservable();
  _estadoParar: Subject<boolean> = new Subject<boolean>();
  estadoParar$ = this._estadoParar.asObservable();
  _return: Subject<boolean> = new Subject<boolean>();
  return$ = this._return.asObservable();
  _PaymentFinalized: Subject<boolean> = new Subject<boolean>();
  PaymentFinalized$ = this._PaymentFinalized.asObservable();

  _EnabledButton: Subject<boolean> = new Subject<boolean>();
  EnabledButton$ = this._EnabledButton.asObservable();
  _FuellingLimitResponse: Subject<FuellingLimit> = new Subject<FuellingLimit>();
  FuellingLimitResponse$ = this._FuellingLimitResponse.asObservable();
  _FuellingLimit: Subject<FuellingLimit> = new Subject<FuellingLimit>();
  FuellingLimit$ = this._FuellingLimit.asObservable();
  _KeyboardStatic: Subject<keyboardstatic> = new Subject<keyboardstatic>();
  KeyboardStatic$ = this._KeyboardStatic.asObservable();
  _KeyboardStaticResponse: Subject<keyboardstatic> = new Subject<keyboardstatic>();
  KeyboardStaticResponse$ = this._KeyboardStaticResponse.asObservable();
  _ticketSelected: Subject<number> = new Subject<number>();
  ticketSelected$ = this._ticketSelected.asObservable();

  constructor() { }

  fnChangedPayment(value: changedPayment) {
    this._changedPayment.next(value);
  }
  fnChangedPaymentFail(value: changedPayment) {
    this._changedPaymentFail.next(value);
  }

  fnButtonDisable(value: number) {
    this._buttonDisable.next(value);
  }
/*
  fnTimerTicket(value: boolean) {
    this._timerTicket.next(value);
  }
  */
  fnResetDocument(value: boolean) {
    this._resetDocument.next(value);
  }
  fnResponseFidelizacion(value: boolean) {
    this._responseFidelizacion.next(value);
  }
  fnEstadoParar(value: boolean) {
    this._estadoParar.next(value);
  }

  fnReturn(value: boolean) {
    this._return.next(value);
  }

  fnDocument(value: Document)  {
    this._document.next(value);
  }
  fnPaymentFinalized(value: boolean) {
    this._PaymentFinalized.next(value);
  }

  fnEnabledTicketandFacturar(value: boolean) {
    this._EnabledButton.next(value);
  }

  fnFuellingLimitResponse(value: FuellingLimit) {
    this._FuellingLimitResponse.next(value);
  }
  fnFuellingLimit(value: FuellingLimit) {
    this._FuellingLimit.next(value);
  }
  fnkeyboard(value: keyboardstatic) {
    this._KeyboardStatic.next(value);
  }
  fnkeyboardResponse(value: keyboardstatic) {
    this._KeyboardStaticResponse.next(value);
  }
  fnTicketSelected(value: number) {
    this._ticketSelected.next(value);
  }
}
