import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { Subject } from 'rxjs/Subject';
import { IActionFinalizable } from 'app/shared/iaction-finalizable';
import { ConfirmActionType } from 'app/shared/confirmAction/confirm-action-type.enum';
import { Subscription } from 'rxjs/Subscription';
import { SessionInternalService } from 'app/services/session/session-internal.service';
import { Document } from 'app/shared/document/document';
import { TelefonoDeudaData } from 'app/shared/telefono-deuda-data';
import { DocumentService } from 'app/services/document/document.service';

interface ActionButton {
  class: string;
  text: string;
  actionClick: Function;
}
@Component({
  selector: 'tpv-telefono-deuda',
  templateUrl: './telefono-deuda.component.html',
  styleUrls: ['./telefono-deuda.component.scss']
})
export class TelefonoDeudaComponent implements OnInit, OnDestroy, IActionFinalizable<boolean> {

  @ViewChild('telefono') telefonoInput: ElementRef;
  private CurrentDocument: Document;
  private TelefonoInicial: string;
  mensaje: string = '';
  entityToPhoneInputHTML: HTMLElement;
  // El modelo bindeado al formulario tiene que existir(estar instanciado),
  // si no Angular no lo instancia por nosotros
  private _telefonoDeudaData: TelefonoDeudaData = { telefono: undefined };

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
    this.Initialize();
  }

  set telefonoDeudaData(telefonoDeudaData: TelefonoDeudaData) {
    this._telefonoDeudaData = telefonoDeudaData;
  }

  get telefonoDeudaData() {
    return this._telefonoDeudaData;
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

  Initialize() {
    this.TelefonoInicial = '';

    if (this.CurrentDocument.customer.phoneNumber != undefined) {
      this._telefonoDeudaData.telefono = this.CurrentDocument.customer.phoneNumber;
      this.TelefonoInicial = this.CurrentDocument.customer.phoneNumber;
    }else if (this.CurrentDocument.customer.addressList[0] != undefined &&
      this.CurrentDocument.customer.addressList[0].phoneNumber != undefined){
        this._telefonoDeudaData.telefono = this.CurrentDocument.customer.addressList[0].phoneNumber;
        this.TelefonoInicial = this.CurrentDocument.customer.addressList[0].phoneNumber;
    }
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

    if (this.ValidarTelefono(this._telefonoDeudaData.telefono)) {

      if (this.CurrentDocument.customer.phoneNumber != this._telefonoDeudaData.telefono) {
        this.CurrentDocument.customer.phoneNumber = this._telefonoDeudaData.telefono;

        this._documentService.UpdateTelCustomerCOFO(this.CurrentDocument);
      }

      this._onConfirmAction.next(true);
    }

  }

  private actionNo() {
    this._onConfirmAction.next(false);
  }

  private ValidarTelefono(tel: string): boolean {

    let telValido: boolean = true;
    this.mensaje = '';

    if (tel == undefined || tel.toString().trim() == '' || tel.toString().indexOf('.') != -1 || isNaN(+tel) || tel.toString().length > 9) {
      telValido = false;
      this.mensaje = 'El teléfono no tiene el formato correcto.';
      this.entityToPhoneInputHTML = <HTMLElement>this.telefonoInput.nativeElement;
      this.entityToPhoneInputHTML.click();
      this.entityToPhoneInputHTML.focus();
    }

    return telValido;
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

}
