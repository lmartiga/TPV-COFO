import { Component, OnInit, OnDestroy, AfterViewInit, HostBinding, ViewChild, ElementRef } from '@angular/core';
import { Subject } from 'rxjs/Subject';
import { Observable } from 'rxjs/Observable';
import { IActionFinalizable } from 'app/shared/iaction-finalizable';
import { OperatorService } from 'app/services/operator/operator.service';
import { ScreenService } from 'app/services/screen/screen.service';
import { Operator } from 'app/shared/operator/operator';
import { LanguageService } from 'app/services/language/language.service';
// import { OperatorInternalService } from 'app/services/operator/operator-internal.service';

@Component({
  selector: 'tpv-operator',
  templateUrl: './operator.component.html',
  styleUrls: ['./operator.component.scss']
})

export class OperatorComponent implements OnInit, OnDestroy, AfterViewInit, IActionFinalizable<Operator> {
  @HostBinding('class') class = 'tpv-operator';
  @ViewChild('operator') operator: ElementRef;

  private _operatorSelected: Subject<Operator> = new Subject();

  operador: Operator;
  textToSearch: string;
  message: string;

  constructor (
    private _operatorService: OperatorService,
    private _screenService: ScreenService,
    private _languageService: LanguageService,
   //  private _operatorInternalService: OperatorInternalService
  ) { }

  ngOnInit() {

  }

  ngAfterViewInit() {
    // NOTA: hack timeout para ejecutar funciones estando ya renderizado el HTML
    this._operatorService.seAbrioOperador();
    setTimeout(() => {
      if (this.operator) {
        (this.operator.nativeElement as HTMLElement).click();
        (this.operator.nativeElement as HTMLElement).focus();
      }
    }, 0);
  }

  ngOnDestroy() {
  }

  // Buscamos el operador solicitado
  searchOperator() {
    this._screenService.bindClickToRequestFullScreen();
    this._operatorService.searchOperator(this.textToSearch)
    .first()
    .subscribe(operator => {
      if (operator == undefined) {
        this.textToSearch = "";
        this.message = this.getLiteral('operator_component','error_OperatorNoValid');
      } else {        
        this._operatorService.estadoOperador(operator.id).first()
        .subscribe(response => {
          if (response) {
            this._operatorService.seAbrioOperadorAcept();
            this.message = '';
            this._operatorSelected.next(operator);
            this._operatorService.fnOperador(operator);
          } else {
            this.textToSearch = "";
            this.message = this.getLiteral('operator_component','error_Operatorblocked');
          }
        });
      }
    });
  }

  onFinish(): Observable<Operator> {
    return this._operatorSelected.asObservable();
  }

  forceFinish(): void {
    /*this._operatorService.limpiadoOperador(this._operatorInternalService.currentOperator.code).first()
    .subscribe(response => {
      if (response) {
    this._operatorSelected.next(undefined);
      }
    });*/
    this._operatorSelected.next(undefined);
  }

  getLiteral(group: string, key: string): string {
    return this._languageService.getLiteral(group, key);
  }
}
