import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { DocumentLine } from 'app/shared/document/document-line';
import { Document } from 'app/shared/document/document';
import { SlideOverService } from 'app/services/slide-over/slide-over.service';
import { DocumentCopyComponent } from 'app/components/actions/options/document-copy/document-copy.component';
import { RunawayComponent } from 'app/components/actions/options/runaway/runaway.component';
import {
  CashboxClosureComponent
} from 'app/components/auxiliar-actions/cashbox-closure/cashbox-closure.component';
import {
  CashEntryComponent
} from 'app/components/auxiliar-actions/cash/cash-entry.component';
import {
  CashOutComponent
} from 'app/components/auxiliar-actions/cash/cash-out.component';
import {
  CreditCardPaymentComponent
} from 'app/components/auxiliar-actions/credit-card-payment/credit-card-payment.component';
import {
  EditDocumentLineComponent
} from 'app/components/auxiliar-actions/edit-document-line/edit-document-line.component';
import {
  SetAmountForZeroPricedArticleComponent
} from 'app/components/auxiliar-actions/set-amount-for-zero-priced-article/set-amount-for-zero-priced-article.component';
import {
  DocumentCancellationComponent
} from 'app/components/actions/options/document-cancellation/document-cancellation.component';
import { CollectionsComponent } from 'app/components/actions/options/collections/collections.component';
import {
  FuellingPointAuxiliarActionsComponent
} from 'app/components/auxiliar-actions/fuelling-points-auxiliar-actions/fuelling-points-auxiliar-actions.component';
import {
  WaitingOperationsAuxiliarPanelComponent
} from 'app/components/auxiliar-actions/waiting-operations-auxiliar-panel/waiting-operations-auxiliar-panel.component';

import { FuellingPointInfo } from 'app/shared/fuelling-point/fuelling-point-info';
import { ExternalActionsViewerComponent } from 'app/components/auxiliar-actions/external-actions-viewer/external-actions-viewer.component';
import { FuellingPointTestComponent } from 'app/components/auxiliar-actions/fuelling-point-test/fuelling-point-test.component';
import { SuplyTransaction } from 'app/shared/fuelling-point/suply-transaction';
import { LoyaltyComponent } from 'app/components/auxiliar-actions/loyalty/loyalty.component';
import { LoyaltyAttributionInformation } from 'app/shared/loyalty/loyalty-attribution-information';
import { GenericHelper } from 'app/helpers/generic-helper';
import { MinimumNeededConfiguration } from 'app/config/minimum-needed.config';
import { CashboxClosureOfflineComponent } from 'app/src/custom/components/cashbox-closure-offline/cashbox-closure-offline.component';
import { CashOutOfflineComponent } from 'app/src/custom/components/cash-offline/cash-out-offline.component';
import { endSaleType } from 'app/shared/endSaleType';
import {
  DocumentCopyAnulacionParcialComponent
} from 'app/components/actions/options/document-copy-anulacion-parcial/document-copy-anulacion-parcial.component';
import { InformeVentasComponent } from 'app/components/actions/options/informe-ventas/informe-ventas.component';
import { DeudasClienteComponent } from 'app/components/actions/options/deudas-cliente/deudas-cliente.component';
import { LogHelper } from 'app/helpers/log-helper';


@Injectable()
export class AuxiliarActionsManagerService {

  constructor(
    private _slideOver: SlideOverService,
    private _minimunNeededConfig: MinimumNeededConfiguration,
    private  _logHelper: LogHelper
  ) {
  }

  // TODO: Eliminar los que ya estén en su internal service correspondiente?


  editDocumentLine(documentLine: DocumentLine): Observable<DocumentLine> {
    if (documentLine.priceWithoutTax != undefined) {
      this._logHelper.trace('AuxiliarActionsManagerService-> Se solicita edición de línea');
      const componentRef = this._slideOver.openFromComponent(EditDocumentLineComponent);
      componentRef.instance.lineToEdit = documentLine;
      return componentRef.instance.onFinish();
    } else {
      this._logHelper.trace('AuxiliarActionsManagerService-> Se solicita edición de línea de producto 0');
      const componentRef = this._slideOver.openFromComponent(SetAmountForZeroPricedArticleComponent);
      componentRef.instance.lineToEdit = documentLine;
      return componentRef.instance.onFinish();
    }
  }

  requestCreditCardSale(currentDocument: Document, invoice: boolean, ventaTipo: endSaleType): Observable<boolean> {
    this._logHelper.trace('AuxiliarActionsManagerService-> Se solicita pago tarjeta');
    const componentRef = this._slideOver.openFromComponent(CreditCardPaymentComponent, true, [], [], true);
    componentRef.instance.setInitialData(currentDocument, invoice, ventaTipo);
    return componentRef.instance.onFinish();
  }

  requestRunawaySale(currentDocument: Document): Observable<boolean> {
    this._logHelper.trace('AuxiliarActionsManagerService-> Se solicita pago fuga');
    const componentRef = this._slideOver.openFromComponent(RunawayComponent);
    componentRef.instance.document = currentDocument;
    return componentRef.instance.onFinish();
  }

  requestCashboxClosure(): Observable<boolean> {
    this._logHelper.trace('AuxiliarActionsManagerService-> Se solicita cierre de caja');
    const componentRef = this._slideOver.openFromComponent(CashboxClosureComponent);
    return componentRef.instance.onFinish();
  }

  requestCashEntry(): Observable<boolean> {
    this._logHelper.trace('AuxiliarActionsManagerService-> Se solicita entrada de caja');
    const componentRef = this._slideOver.openFromComponent(CashEntryComponent);
    return componentRef.instance.onFinish();
  }

  requestCashOut(): Observable<boolean> {
    this._logHelper.trace('AuxiliarActionsManagerService-> Se solicita salida de caja');
    const componentRef = this._slideOver.openFromComponent(CashOutComponent);
    return componentRef.instance.onFinish();
  }

  // se abre en formato extendido
  collectRunawayDebt(): Observable<boolean> {
    let colStyles: string =
        GenericHelper.getStylesConfigByWidthPrecentage(this._minimunNeededConfig.auxiliaryPanelsDefaultConfiguration.widthPercentage);
    // algunas veces la cadena viene con undefined por eso la limpio de ellos
    colStyles = colStyles.replace('undefined', '');
    const extraClasses = ['tpv-slide-over', 'noP'];
    // introduzclo las clases una por una al array
    colStyles.split(' ').forEach(item => extraClasses.push(item));
    const componentRef = this._slideOver.openFromComponent(CollectionsComponent, true, [], extraClasses );
    componentRef.instance.isRunawayDebt = true;
    return componentRef.instance.onFinish();
  }
  // se abre en formato extendido
  collectPendingDocument(): Observable<boolean> {
    let colStyles: string =
        GenericHelper.getStylesConfigByWidthPrecentage(this._minimunNeededConfig.auxiliaryPanelsDefaultConfiguration.widthPercentage);
    // algunas veces la cadena viene con undefined por eso la limpio de ellos
    colStyles = colStyles.replace('undefined', '');
    const extraClasses = ['tpv-slide-over', 'noP'];
    // introduzclo las clases una por una al array
    colStyles.split(' ').forEach(item => extraClasses.push(item));
    const componentRef = this._slideOver.openFromComponent(CollectionsComponent, true, [], extraClasses);
    componentRef.instance.isRunawayDebt = false;
    return componentRef.instance.onFinish();
  }

  deudasClienteDocument(): Observable<boolean> {
    let colStyles: string =
        GenericHelper.getStylesConfigByWidthPrecentage(this._minimunNeededConfig.auxiliaryPanelsDefaultConfiguration.widthPercentage);
    // algunas veces la cadena viene con undefined por eso la limpio de ellos
    colStyles = colStyles.replace('undefined', '');
    const extraClasses = ['tpv-slide-over', 'noP'];
    // introduzclo las clases una por una al array
    colStyles.split(' ').forEach(item => extraClasses.push(item));
    const componentRef = this._slideOver.openFromComponent(DeudasClienteComponent, true, [], extraClasses);
    componentRef.instance.isRunawayDebt = false;
    return componentRef.instance.onFinish();
  }

  requestDocumentCopy(): Observable<boolean> {
    this._logHelper.trace('AuxiliarActionsManagerService-> Se solicita copia documento');
    const componentRef = this._slideOver.openFromComponent(DocumentCopyComponent);
    return componentRef.instance.onFinish();
  }

  requestDocumentCancellation(): Observable<boolean> {
    this._logHelper.trace('AuxiliarActionsManagerService-> Se solicita copia documento');
    const componentRef = this._slideOver.openFromComponent(DocumentCancellationComponent);
    return componentRef.instance.onFinish();
  }

  requestDocumentCancellationParcial(): Observable<boolean> {
    this._logHelper.trace('AuxiliarActionsManagerService-> Se solicita copia documento');
    const componentRef = this._slideOver.openFromComponent(DocumentCopyAnulacionParcialComponent);
    return componentRef.instance.onFinish();
  }

  requestInformeVentas(): Observable<boolean> {
    this._logHelper.trace('AuxiliarActionsManagerService-> Se solicita requestInformeVentas');
    /*const componentRef = this._slideOver.openFromComponent(InformeVentasComponent);
    return componentRef.instance.onFinish();*/


    const tpvElement = document.getElementsByClassName('tpv-fuelling-points')[0];
    let porcentaje = 0;

    if (tpvElement !== undefined) {
      const tpvWidth = tpvElement.clientWidth;
      const screenWidth = screen.width;
      porcentaje = ((tpvWidth / screenWidth) * 100);
    }

    let colStyles: string = GenericHelper.getStylesConfigByWidthPrecentage(
      porcentaje > 0 ? 100 - porcentaje : this._minimunNeededConfig.auxiliaryPanelsDefaultConfiguration.extendedtWidthPercentage);

    // algunas veces la cadena viene con undefined por eso la limpio de ellos
    colStyles = colStyles.replace('undefined', '');
    const extraClasses = ['tpv-slide-over', 'noP'];
    // introduzclo las clases una por una al array
    colStyles.split(' ').forEach(item => extraClasses.push(item));
    extraClasses.push('overflowyAuto');
    const componentRef = this._slideOver.openFromComponent(InformeVentasComponent, true, [] , extraClasses);
    return componentRef.instance.onFinish();
  }

  requestFuellingPointOperations(fuellingPoint: FuellingPointInfo, fpAllList: Array<FuellingPointInfo>,
    fpAllListSuplyTransaction: Array<SuplyTransaction>): Observable<boolean> {
    const componentRef = this._slideOver.openFromComponent(FuellingPointAuxiliarActionsComponent);
    const valfpWidth = jQuery('tpv-fuelling-points').width();
    this._slideOver.modifySlideOverMarginLeft(valfpWidth + 'px');
    componentRef.instance.fuellingPoint = fuellingPoint;
    componentRef.instance.fpInformation = fpAllList;
    componentRef.instance.supplyTransaction = fpAllListSuplyTransaction;
    return componentRef.instance.onFinish();
  }

  requestWaitingOperations(): Observable<boolean> {
    const componentRef = this._slideOver.openFromComponent(WaitingOperationsAuxiliarPanelComponent);
    return componentRef.instance.onFinish();
  }

  requestIframe(url: string): Observable<boolean> {

    const value = GenericHelper.getQueryStringValue('slideOver', url);
    if (value == 'extended') {
      let colStyles: string =
        GenericHelper.getStylesConfigByWidthPrecentage(this._minimunNeededConfig.auxiliaryPanelsDefaultConfiguration.extendedtWidthPercentage);
      // algunas veces la cadena viene con undefined por eso la limpio de ellos
      colStyles = colStyles.replace('undefined', '');
      const extraClasses = ['tpv-slide-over', 'noP'];
      // introduzclo las clases una por una al array
      colStyles.split(' ').forEach(item => extraClasses.push(item));
      const componentRef =
        this._slideOver.openFromComponent(ExternalActionsViewerComponent, true, [], extraClasses);
      componentRef.instance.pagina = url;
      return componentRef.instance.onFinish();
    } else {
      const componentRef = this._slideOver.openFromComponent(ExternalActionsViewerComponent);
      componentRef.instance.pagina = url;
      return componentRef.instance.onFinish();
    }
  }

  requestFuellingPointTest(supplyTransaction: SuplyTransaction): Observable<boolean> {
    const componentRef = this._slideOver.openFromComponent(FuellingPointTestComponent);
    componentRef.instance.supplyTransaction = supplyTransaction;
    return componentRef.instance.onFinish();
  }

  requestLoyaltyOperation(
    documentTotalAmount: number,
    documentCurrencyId: string): Observable<LoyaltyAttributionInformation> {

    const componentRef = this._slideOver.openFromComponent(LoyaltyComponent);
    componentRef.instance.documentTotalAmount = documentTotalAmount;
    componentRef.instance.documentCurrencyId = documentCurrencyId;
    return componentRef.instance.onFinish();
  }

  /*REQUISITOS DE CIERRE DIFERIDOS OFFLINE*/
  requestCashboxClosureOffline(): Observable<boolean> {
    this._logHelper.trace('AuxiliarActionsManagerService-> Se solicita cierre de caja Offline');
    const componentRef = this._slideOver.openFromComponent(CashboxClosureOfflineComponent);
    return componentRef.instance.onFinish();
  }

  requestCashOutOffline(typeCash: string): Observable<boolean> {
    this._logHelper.trace('AuxiliarActionsManagerService-> Se solicita ' + typeCash + ' de caja Offline');
    const componentRef = this._slideOver.openFromComponent(CashOutOfflineComponent);
    componentRef.instance.type = typeCash; // Tipo: Entrada o Salida
    return componentRef.instance.onFinish();
  }
}
