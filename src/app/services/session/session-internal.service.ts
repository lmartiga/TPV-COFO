import { Injectable } from '@angular/core';
import { Subject } from 'rxjs/Subject';
import { keyboardstatic } from 'app/shared/Keyboard/keyboard-static';
import { Operator } from 'app/shared/operator/operator';
import { SidebarResponse } from 'app/shared/sidebards/sidebar-response';

@Injectable()
export class SessionInternalService {

  _isOperatorConnect: Subject<boolean> = new Subject<boolean>();
  isOperatorConnect$ = this._isOperatorConnect.asObservable();

  _clickedInDOM: Subject<SidebarResponse> = new Subject<SidebarResponse>();
  clickedInDOM$ = this._clickedInDOM.asObservable();

  _openSidebar: Subject<SidebarResponse> = new Subject<SidebarResponse>();
  openSidebar$ = this._openSidebar.asObservable();

  _cleanKeyboardSession: Subject<keyboardstatic> = new Subject<keyboardstatic>();
  cleanKeyboardSession$ = this._cleanKeyboardSession.asObservable();

  _keyboardSessionResponse: Subject<keyboardstatic> = new Subject<keyboardstatic>();
  keyboardSessionResponse$ = this._keyboardSessionResponse.asObservable();

  _getOperatorToLoginSession: Subject<Operator> = new Subject<Operator>();
  getOperatorToLoginSession$ = this._getOperatorToLoginSession.asObservable();

  _clickConfirmActionDispenser: Subject<boolean> = new Subject<boolean>();
  clickConfirmActionDispenser$ = this._clickConfirmActionDispenser.asObservable();

  _clickOpenStopDispenser: Subject<boolean> = new Subject<boolean>();
  clickOpenStopDispenser$ = this._clickOpenStopDispenser.asObservable();

  _ActivacionPopup: Subject<boolean> = new Subject<boolean>();
  ActivacionPopup$ = this._ActivacionPopup.asObservable();

  _DesactivarPopup: Subject<boolean> = new Subject<boolean>();
  DesactivarPopup$ = this._DesactivarPopup.asObservable();
  
  constructor() { }

  fnSetOperatorConnected(value: boolean) {
    this._isOperatorConnect.next(value);
  }

  fnClickedInDOM (value: SidebarResponse) {
    this._clickedInDOM.next(value);
  }

  fnOpenSidebar (value: SidebarResponse) {
    this._openSidebar.next(value);
  }

  fnCleanKeyboardSession (value: keyboardstatic) {
    this._cleanKeyboardSession.next(value);
  }

  fnSetValueKeyboardSession (value: keyboardstatic) {
    this._keyboardSessionResponse.next(value);
  }

  fnSetOperatorToLogin (value: Operator) {
    this._getOperatorToLoginSession.next(value);
  }

  onClickConfirmAction (value: boolean) {
    this._clickConfirmActionDispenser.next(value);
  }

  onClickStopDispenser (value: boolean) {
    this._clickOpenStopDispenser.next(value);
  }
  fnActivacionPopup(value: boolean){
    this._ActivacionPopup.next(value);
  }
  fnDesactivarPopup(value: boolean){
    this._DesactivarPopup.next(value);
  }
}
