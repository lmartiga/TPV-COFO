import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { Subject } from 'rxjs/Subject';
import { IActionFinalizable } from 'app/shared/iaction-finalizable';
import { ConfirmActionType } from 'app/shared/confirmAction/confirm-action-type.enum';
import { Subscription } from 'rxjs/Subscription';
import { SessionInternalService } from 'app/services/session/session-internal.service';
import { Document } from 'app/shared/document/document';
import { MatriculaClienteData } from 'app/shared/matricula-cliente-data';
import { DocumentService } from 'app/services/document/document.service';


interface ActionButton {
  class: string;
  text: string;
  actionClick: Function;
}
@Component({
  selector: 'tpv-matricula-cliente',
  templateUrl: './matricula-cliente.component.html',
  styleUrls: ['./matricula-cliente.component.scss']
})
export class MatriculaClienteComponent implements OnInit, OnDestroy, IActionFinalizable<boolean> {

  @ViewChild('matricula') matriculaInput: ElementRef;
  private CurrentDocument: Document;
  mensaje: string = '';
  entityToMatriculaInputHTML: HTMLElement;
  // El modelo bindeado al formulario tiene que existir(estar instanciado),
  // si no Angular no lo instancia por nosotros
  private _matriculaClienteData: MatriculaClienteData = { matricula: undefined };

  private _onConfirmAction: Subject<boolean> = new Subject();
  _subscriptions: Subscription[] = [];
  // default icon
  materialIcon: string = 'warning';
  // default text
  textQuestion: string = '¿Está seguro?';
  // default title
  textTitle: string = 'Confirmar Acción';
  // default type
  type: ConfirmActionType = ConfirmActionType.Warning;
  // availaleButtons
  confirmActions = new Array<ActionButton>();
  constructor(
    private _session: SessionInternalService,
    private _documentService: DocumentService
  ) { }

  SetDocumentoInicial(documento: Document) {
    this.CurrentDocument = documento;
  }

  set matriculaClienteData(matriculaClienteData: MatriculaClienteData) {
    this._matriculaClienteData = matriculaClienteData;
  }

  get matriculaClienteData() {
    return this._matriculaClienteData;
  }

  /* IActionFinalizable */
  onFinish() {
    return this._onConfirmAction.asObservable();
  }
  forceFinish() {
    this._onConfirmAction.next(undefined);
  }
  /* end IActionFinalizable*/
  ngOnInit() {
    this._subscriptions.push(this._session.clickConfirmActionDispenser$.subscribe(data => {
      if (data) {
        this.actionYes();
      } else {
        this.actionNo();
      }
    }));
  }
  ngOnDestroy(): void {
    this._subscriptions.forEach(p => p.unsubscribe());
  }

  confirmAction(
    textQuestion: string = '¿Está seguro?',
    textYes: string = 'Sí',
    textNo: string = 'No',
    title: string = 'Confirmar Acción',
    type: ConfirmActionType = ConfirmActionType.Warning,
  ) {
    this.textQuestion = textQuestion;
    this.textTitle = title;
    this.type = type;
    const bootstrap50 = 'col-xs-6';
    const bootstrap100 = 'col-xs-12';
    switch (type) {
      case ConfirmActionType.Alert:
        this.materialIcon = 'warning';
        this.addActionButton(textYes, bootstrap50, () => this.actionYes());
        break;
      case ConfirmActionType.Warning:
        this.materialIcon = 'warning';
        this.addActionButton(textYes, bootstrap50, () => this.actionYes());
        this.addActionButton(textNo, bootstrap50, () => this.actionNo());
        break;
      case ConfirmActionType.Question:
        this.materialIcon = 'help';
        this.addActionButton(textYes, bootstrap50, () => this.actionYes());
        this.addActionButton(textNo, bootstrap50, () => this.actionNo());
        break;
      case ConfirmActionType.Error:
      case ConfirmActionType.Information:
        this.materialIcon = 'highlight_off';
        this.addActionButton(textYes, bootstrap100, () => this.actionYes());
        break;
      case ConfirmActionType.None:
      default:
        this.materialIcon = 'highlight_off';
        break;
    }
  }

  private actionYes() {

    if (this.ValidarMatricula(this._matriculaClienteData.matricula)) {

      // Vinculamos la matrícula introducida al cliente.
      this._documentService.VincularMatriculaClienteCOFO(this.CurrentDocument.customer.id, this._matriculaClienteData.matricula)
        .first().subscribe(response => {
          if (response != undefined && response == true) {
            this.CurrentDocument.customer.matricula = this._matriculaClienteData.matricula;
            this._onConfirmAction.next(true);
          }
          else {
            this.mensaje = 'La matrícula introducida ya está asociada a otro cliente.';
            this.entityToMatriculaInputHTML = <HTMLElement>this.matriculaInput.nativeElement;
            this.entityToMatriculaInputHTML.click();
            this.entityToMatriculaInputHTML.focus();
          }
      });

    }

  }

  private actionNo() {
    this._onConfirmAction.next(true);
  }

  private ValidarMatricula(mat: string): boolean {

    let matValido: boolean = true;
    this.mensaje = '';

    if (mat == undefined || mat.toString().trim() == '') {
      matValido = false;
      this.mensaje = 'No puede introducir una matrícula vacía.';
      this.entityToMatriculaInputHTML = <HTMLElement>this.matriculaInput.nativeElement;
      this.entityToMatriculaInputHTML.click();
      this.entityToMatriculaInputHTML.focus();
    }

    return matValido;
  }

  setClassIcon() {
    return {
      'coacIcon': true,
      'iconAlert': this.type == ConfirmActionType.Alert,
      'iconError': this.type == ConfirmActionType.Error,
      'iconInformation': this.type == ConfirmActionType.Information,
      'iconWarning': this.type == ConfirmActionType.Warning,
      'iconQuestion': this.type == ConfirmActionType.Question
    };
  }

  // inserta un boton de accion para el cuadro
  private addActionButton(text: string, bootstrapClass: string, action: Function): void {
    this.confirmActions.push({
      class: `noP ${bootstrapClass}`,
      text: text,
      actionClick: action
    });
  }

  matriculaClick() {
    this.entityToMatriculaInputHTML = <HTMLElement>this.matriculaInput.nativeElement;
    this.entityToMatriculaInputHTML.click();
    this.entityToMatriculaInputHTML.focus();
  }

}
