import { Injectable } from '@angular/core';
import { Subject } from 'rxjs/Subject';
import { Observable } from 'rxjs/Observable';

import { Operator } from 'app/shared/operator/operator';
import { OperatorService } from 'app/services/operator/operator.service';
import { OperatorComponent } from 'app/components/operator/operator.component';
import { SlideOverService } from 'app/services/slide-over/slide-over.service';
import { AppDataConfiguration } from 'app/config/app-data.config';
import { StatusBarService } from '../status-bar/status-bar.service';
import { LanguageService } from 'app/services/language/language.service';
import { LogHelper } from 'app/helpers/log-helper';
// TODO: Este servicio habría que cambiarlo.
//       Si queremos tener un almacén global donde guardar tanto el operador como el cliente actual (y seguramente también
//       la lista de documentos, documento actual, etc...) hay que crear dicho servicio con un nombre que deje claro de manera
//       cristalina lo que hace.

@Injectable()
export class OperatorInternalService {

  // operador introducido
  private _currentOperatorChanged = new Subject<Operator>();
  private _defaultOperatorSubject: Subject<Operator> = new Subject();
  private _operator = new Subject<Operator>();
  private _currentOperator: Operator;
  private _defaultOperator: Operator;
  _operador: Subject<string> = new Subject<string>();
  operador$ = this._operador.asObservable();

  constructor(
    private _slideOver: SlideOverService,
    private _appDataConfig: AppDataConfiguration,
    private _operatorService: OperatorService,
    private _statusBarService: StatusBarService,
    private _languageService: LanguageService,
    private  _logHelper: LogHelper
  ) { }

  operatorChanged(): Observable<Operator> {
    return this._currentOperatorChanged.asObservable();
  }

  set currentOperator(operator: Operator) {
    this._currentOperator = operator;
    this._currentOperatorChanged.next(operator);
    this._currentOperator = operator;
  }

  get currentOperator(): Operator {
    return this._currentOperator;
  }

  get defaultOperator(): Operator {
    return this._defaultOperator;
  }

  requestOperator(usedDefaultOperator: boolean): Observable<Operator> {
    if (this._appDataConfig.defaultOperator && !usedDefaultOperator) {
    // Comprobamos si el operador esta usado por otro TPV
    this._operatorService.estadoOperador(this._appDataConfig.defaultOperator).first()
        .subscribe(response => {
          if (response) {
            // Si no esta siendo usado seguimos el camino normal
            this._getDefaultOperator(this._appDataConfig.defaultOperator)
            .first()
            .subscribe(operator => {
              this._defaultOperator = operator;
              this._operator.next(operator);
            });
          } else {
            this._statusBarService.publishMessage(this._languageService.getLiteral('operator_internal_service','error_DefaultOperatorblocked'));
            // Si esta siendo usado
            // Si no hay por defecto, se pide con el panel auxiliar
            this.getOperator()
            .first()
            .subscribe(operator => {
              // TODO cuando hay nuevo operador este pasa a ser el por defecto hasta que lo cambien
              this._operator.next(operator);
            });
          }
        });
    } else {
      // Si no hay por defecto, se pide con el panel auxiliar
      this.getOperator()
      .first()
      .subscribe(operator => {
        // TODO cuando hay nuevo operador este pasa a ser el por defecto hasta que lo cambien
        this._operator.next(operator);
      });
    }
    return this._operator.asObservable();
  }

  // pide la introducción de un operador con el panel auxiliar
  getOperator(): Observable<Operator> {
    this._logHelper.trace('AuxiliarActionsManagerService-> Se solicita operador');
    const componentRef = this._slideOver.openFromComponent(OperatorComponent);
    return componentRef.instance.onFinish();
  }

  //

  private _getDefaultOperator(defaultOperatorId: string): Observable<Operator> {
    this._operatorService.getOperator(defaultOperatorId)
      .first()
      .subscribe(operator => {
        this._defaultOperatorSubject.next(operator);
      });
    return this._defaultOperatorSubject.asObservable();
  }
  ObsOperador(value: string) {
    this._operador.next(value);
  }

  fnExistOperatorMultiTpv(): boolean {
    return this._operatorService.fnExistOperatorMultiTpv();
  }

  fnExistOperatorinTpv(tpv: string): boolean {
    return this._operatorService.fnExistOperatorinTpv(tpv);
  }

  // // informar del operador introducido
  // // y a veces de borrar cliente también
  // public publishSetOperator(operator: Operator, customerempty: boolean) {
  //   if (customerempty) {
  //     this._operatorcustomerempty.next(operator);
  //   } else {
  //     this._operatorIntroduced.next(operator);
  //   }
  // }

  // // informar del reset operador
  // public publishSetOperatorEmpty() {
  //   this._operatorEmpty.next(true);
  // }
}
