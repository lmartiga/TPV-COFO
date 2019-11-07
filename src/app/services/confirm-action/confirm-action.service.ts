import { Injectable } from '@angular/core';
import { ConfirmActionType } from 'app/shared/confirmAction/confirm-action-type.enum';
import { Observable } from 'rxjs/Observable';
import { SlideOverService } from 'app/services/slide-over/slide-over.service';
import { ConfirmActionComponent } from 'app/components/auxiliar-actions/confirm-action/confirm-action.component';
import { Document } from 'app/shared/document/document';
import { TelefonoDeudaComponent } from 'app/components/actions/options/telefono-deuda/telefono-deuda.component';
import { TpvStatusCheckerService } from 'app/services/tpv-status-checker.service';
import { MatriculaClienteComponent } from 'app/components/actions/options/matricula-cliente/matricula-cliente.component';
import { ConfirmActionSlideStaticComponent } from 'app/components/auxiliar-actions/confirm-action-slide-static/confirm-action-slide-static.component';


@Injectable()
export class ConfirmActionService {

  constructor(
    private _slideOver: SlideOverService,
    private _tpvStatusCheckerService: TpvStatusCheckerService
  ) { }
  promptActionConfirm(
    textQuestion?: string,
    textYes?: string,
    textNo?: string,
    title?: string,
    type?: ConfirmActionType, ): Observable<boolean> {
    const componentRef = this._slideOver.openFromComponent(ConfirmActionComponent);
    componentRef.instance.confirmAction(textQuestion, textYes, textNo, title, type);
    return componentRef.instance.onFinish();
  }

  promptActionConfirmStatic(
    textQuestion?: string,
    textYes?: string,
    textNo?: string,
    title?: string,
    type?: ConfirmActionType, ): Observable<boolean> {
    const componentRef = this._slideOver.openFromComponent(ConfirmActionSlideStaticComponent);
    componentRef.instance.confirmAction(textQuestion, textYes, textNo, title, type);
    return componentRef.instance.onFinish();
  }

  promptActionConfirmTelefonoDeuda(
    textQuestion?: string,
    textYes?: string,
    textNo?: string,
    title?: string,
    type?: ConfirmActionType,
    documento?: Document): Observable<boolean> {

    let componentRef: any;

    if (this._tpvStatusCheckerService.tipoConectado == true) {
      componentRef = this._slideOver.openFromComponent(TelefonoDeudaComponent);
      componentRef.instance.confirmAction(textQuestion, textYes, textNo, title, type);
      componentRef.instance.SetDocumentoInicial(documento);
    }
    else {
      componentRef = this._slideOver.openFromComponent(ConfirmActionComponent);
      componentRef.instance.confirmAction(textQuestion, textYes, textNo, title, type);
    }

    return componentRef.instance.onFinish();
  }

  promptActionConfirmMatriculaCliente(
    textQuestion?: string,
    textYes?: string,
    textNo?: string,
    title?: string,
    type?: ConfirmActionType,
    documento?: Document): Observable<boolean> {

    const componentRef = this._slideOver.openFromComponent(MatriculaClienteComponent);
    componentRef.instance.confirmAction(textQuestion, textYes, textNo, title, type);
    componentRef.instance.SetDocumentoInicial(documento);

    return componentRef.instance.onFinish();
  }

}
