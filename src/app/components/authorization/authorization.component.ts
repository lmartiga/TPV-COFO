import { Component, OnInit, HostBinding, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { IActionFinalizable } from 'app/shared/iaction-finalizable';
import { Observable } from 'rxjs/Observable';
import { Subject } from 'rxjs/Subject';
import { AuthorizationService } from 'app/services/authorization/authorization.service';
import { AuthorizationContext } from 'app/shared/authorization/authorization-context';
import { AuthorizationEntityType } from 'app/shared/authorization/authorization-entity-type.enum';
import { LanguageService } from 'app/services/language/language.service';
import { LogHelper } from 'app/helpers/log-helper';

@Component({
  selector: 'tpv-authorization',
  templateUrl: './authorization.component.html',
  styleUrls: ['./authorization.component.scss']
})
export class AuthorizationComponent implements OnInit, AfterViewInit, IActionFinalizable<boolean> {

  @HostBinding('class') class = 'tpv-operator';
  @ViewChild('authorizationInput') authorizationInput: ElementRef;

  private _authorizationCompleted: Subject<boolean | undefined> = new Subject();

  // propiedad que debe inyectar el invocador
  authorizationContext: AuthorizationContext;

  // variables bindeadas a la vista
  errorMessage: string = '';
  entityToAuthorize: string = '';
  entityToAuthorizeInputHTML: HTMLElement;
  placeholder: string = '';

  constructor(
    private _authService: AuthorizationService,
    private _languageService: LanguageService,
    private _logHelper: LogHelper
  ) {
  }

  ngOnInit() {
    // Según el contexto de autorización que nos hayan pasado al instanciarnos, mostraremos un texto diferente en el placeholder del input
    switch (this.authorizationContext.entityType) {
      case AuthorizationEntityType.operator:
        this.placeholder = this.getLiteral('authorization_component', 'placeHolder_Authorization_SetOperator');
        break;
      default:
        this.placeholder = '';
        break;
    }
  }

  ngAfterViewInit() {
    this.entityToAuthorizeInputHTML = <HTMLElement>this.authorizationInput.nativeElement;
    this.entityToAuthorizeInputHTML.click();
    this.entityToAuthorizeInputHTML.focus();
  }

  authorize() {
    if (this.entityToAuthorize != '') {
      this._authService.authorize(this.authorizationContext, this.entityToAuthorize).subscribe(
        (response: boolean) => {
          if (response === true) {
            this._authorizationCompleted.next(true);
          } else {
            this._authorizationCompleted.next(false);
          }
        },
        err => {
          this._logHelper.logError(err);
          this._authorizationCompleted.error(err);
        },
        () => this._authorizationCompleted.complete()
      );
    }
  }

  onFinish(): Observable<boolean> {
    return this._authorizationCompleted.asObservable();
  }

  forceFinish(): void {
    this._authorizationCompleted.next(undefined);
  }

  getLiteral(group: string, key: string): string {
    return this._languageService.getLiteral(group, key);
  }

}
