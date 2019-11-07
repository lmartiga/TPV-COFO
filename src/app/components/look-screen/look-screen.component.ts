import { Component, OnInit, OnDestroy } from '@angular/core';
import { OperatorService } from 'app/services/operator/operator.service';
import { ScreenService } from 'app/services/screen/screen.service';
import { StatusBarService } from 'app/services/status-bar/status-bar.service';
import { SessionInternalService } from 'app/services/session/session-internal.service';
import { DocumentInternalService } from 'app/services/document/document-internal.service';
import { LanguageService } from 'app/services/language/language.service';
import { OperatorInternalService } from 'app/services/operator/operator-internal.service';
import { Subscription } from 'rxjs/Subscription';
import { keyboardstatic } from 'app/shared/Keyboard/keyboard-static';
import { SlideOverService } from 'app/services/slide-over/slide-over.service';
import { MinimumNeededConfiguration } from 'app/config/minimum-needed.config';
@Component({
  selector: 'tpv-look-screen',
  templateUrl: './look-screen.component.html',
  styleUrls: ['./look-screen.component.scss']
})
export class LookScreenComponent implements OnInit, OnDestroy {
  private _subscriptions: Subscription[] = [];
  clickStopDispenser: boolean;
  wantStopPump: boolean;
  msjtexto: string;
  responseKeyboard: keyboardstatic = {
    tipo: 4,
    value: '',
    intro: 'enter',
    isPassword: true
  };

  constructor(
    private _operatorService: OperatorService,
    private _screenService: ScreenService,
    private _statusBarService: StatusBarService,
    private _session: SessionInternalService,
    private _documentService: DocumentInternalService,
    private _languageService: LanguageService,
    private _operatorInternalService: OperatorInternalService,
    private _slideoverservice: SlideOverService,
    private _conf: MinimumNeededConfiguration
    ) { }

  ngOnInit() {
    this.clickStopDispenser = false;
    this._subscriptions.push(this._session.keyboardSessionResponse$.subscribe(response => {
      this.buttonPressSubmit(response);
    }));
    this._subscriptions.push(this._session.clickOpenStopDispenser$.subscribe(response => {
      this.wantStopPump = !response;
      this.clickStopDispenser = true;
    }));
    this._subscriptions.push(this._session.clickConfirmActionDispenser$.subscribe(response => {
      this.clickStopDispenser = false;
    }));

    this.msjtexto = this.getLiteral('container_session', 'msj_texto');
  }

  ngOnDestroy(): void {
    this._subscriptions.forEach(s => s.unsubscribe());
  }

  onKeydown(event: any) {
    if (event.key === 'Enter') {
      event.preventDefault();
    }
  }

  buttonPressSubmit(val: keyboardstatic) {
    this._screenService.bindClickToRequestFullScreen();
    if (this.isCurrentOperator(String(val.value))) {
      this._operatorService.searchOperator(String(val.value))
      .first()
      .subscribe(operator => {
        if (operator == undefined) {
          this._statusBarService.publishMessage(this.getLiteral('container_session', 'literal_IncorrectOperator'));
          this._session.fnCleanKeyboardSession(this.responseKeyboard);
          this._session.fnSetOperatorToLogin(undefined);
        } else {
          this._slideoverservice._CloseSlider();
          this._operatorService.seAbrioOperadorAcept();
          this._session.fnSetOperatorToLogin(operator);
          this._session.fnSetOperatorConnected(true);
          this._operatorService.fnOperador(operator);

          this._statusBarService.publishMessage(this.getLiteral('container_session', 'literal_Synchronization'));
          // Enviar indefinidos para limpiar cache de datos
          const cleanCacheKeyboard: keyboardstatic = {
            tipo: undefined,
            value: '',
            intro: 'enter',
            isPassword: false
          };
          this._session.fnCleanKeyboardSession(cleanCacheKeyboard);
        }
      });
    } else {
      this._statusBarService.publishMessage(this.getLiteral('container_session', 'literal_CurrentOperator'));
      this._session.fnCleanKeyboardSession(this.responseKeyboard);
    }
  }

  currentDocumentHasProducts (): boolean {
    return this._documentService.countLinesFromDocument() > 0;
  }

  isCurrentOperator(operatorCode: string): boolean {
    // tslint:disable-next-line:max-line-length
    return this._operatorInternalService.currentOperator == undefined || this._operatorInternalService.currentOperator.code == operatorCode || this._operatorInternalService.currentOperator.login == operatorCode;
  }
  getLiteral(group: string, key: string): string {
    return this._languageService.getLiteral(group, key);
  }

  get tpvVersion(): string {
    const version = this._conf.tpvVersion;
    return version == undefined || version.trim() == '' ? '-' : version;
  }

}
