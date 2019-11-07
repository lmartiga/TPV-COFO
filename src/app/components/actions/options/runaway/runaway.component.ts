import { Component, OnInit, OnDestroy, HostBinding, AfterViewInit } from '@angular/core';
import { Subject } from 'rxjs/Subject';
import { Observable } from 'rxjs/Observable';

import { IActionFinalizable } from 'app/shared/iaction-finalizable';
import { StatusBarService } from 'app/services/status-bar/status-bar.service';
import { Document } from 'app/shared/document/document';
import { RunawayPaymentService } from 'app/services/payments/runaway-payment.service';
import { RunawayData } from 'app/shared/runaway-data';
import { DocumentInternalService } from '../../../../services/document/document-internal.service';
import { AppDataConfiguration } from 'app/config/app-data.config';
import { LanguageService } from 'app/services/language/language.service';
import { LogHelper } from 'app/helpers/log-helper';

@Component({
  selector: 'tpv-runaway',
  templateUrl: './runaway.component.html',
  styleUrls: ['./runaway.component.scss']
})
export class RunawayComponent implements OnInit, OnDestroy, AfterViewInit, IActionFinalizable<boolean> {
  @HostBinding('class') class = 'tpv-runaway';

  private _onRunawayPayment: Subject<boolean> = new Subject();
  private _currentDocument: Document;
  /**
   * Indica si se enviado la peticion de finalizar venta.
   */
  private _requesting: boolean = false;
  // El modelo bindeado al formulario tiene que existir(estar instanciado),
  // si no Angular no lo instancia por nosotros
  private _runawayData: RunawayData = { plate: undefined, remarks: undefined };
  mensaje: string ;
  constructor(
    private _statusBarService: StatusBarService,
    private _runawayService: RunawayPaymentService,
    private _documentInternalService: DocumentInternalService,
    private _appDataConfiguration: AppDataConfiguration,
    private _languageService: LanguageService,
    private  _logHelper: LogHelper
  ) {
  }

  ngOnInit() {
  }

  ngOnDestroy() {
  }
  ngAfterViewInit() {
    if (!this._runawayService.existsRunawayPaymentMethod()) {
      this.forceFinish();
    }
  }
  set document(document: Document) {
    this._currentDocument = document;
  }

  set runawayData(runawayData: RunawayData) {
    this._runawayData = runawayData;
  }

  get runawayData() {
    return this._runawayData;
  }


  onFinish(): Observable<boolean> {
    return this._onRunawayPayment.asObservable();
  }

  forceFinish(): void {
    this._onRunawayPayment.next(false);
  }
  /**
   * Marca como deshabilitado boton segun se cumplan criterios
   * (ie. peticiones pendientes)
   */
  isButtonDisabled(): boolean {
    return this._requesting;
  }
  onSubmit() {
    if (this._requesting) {
      return;
    }

    this._currentDocument.isDeuda = false;

    if (this._currentDocument != undefined &&
      this._currentDocument.lines != undefined &&
      this._currentDocument.lines.length == 1) {
      this._requesting = true;
      this._currentDocument.cambio = this._currentDocument.cambio != undefined ? 0.00 : 0.00;
      this._runawayService.sendRunawayPayment(this._currentDocument, this.runawayData)
        .first()
        .subscribe(
          success => {
            this._logHelper.trace('REALIZAR VENTA FUGA:');
            this._logHelper.trace(success);
            if (success) {
              this._statusBarService.publishMessage(this.getLiteral('runaway_component', 'message_Runaway_RunawaySuccessfully'));
              this._requesting = false;
              this._onRunawayPayment.next(true);
            } else {
              this._statusBarService.publishMessage(this.getLiteral('runaway_component', 'error_Runaway_RunawayCouldNotBeRegistered'));
              this._requesting = false;
            }
          },
          error => {
            this._logHelper.trace(error);
            this._statusBarService.publishMessage(this.getLiteral('runaway_component', 'error_Runaway_RunawayCouldNotBeRegistered'));
            this._requesting = false;
          });
    } else {
      this._statusBarService.publishMessage(this.getLiteral('runaway_component', 'error_Runaway_NoDocument'));
    }
  }

  mostrarMensaje(): boolean {
    try {
      const parm = this._appDataConfiguration.getConfigurationParameterByName('TYPE_ARTICLE_LEAKS', 'TPV') ;
      if ( parm == undefined) {
        return true;
      }
      const currentDocument = this._documentInternalService.currentDocument;
      if (this._currentDocument.customer.id == this._appDataConfiguration.unknownCustomerId) {
        if (currentDocument != undefined &&
          currentDocument.lines != undefined &&
          currentDocument.lines.length > 0) {
            if (parm.meaningfulStringValue == 'COMBU') {
              this.mensaje = this.getLiteral('runaway_component', 'message_Runaway_LeakFuelProducts');
            }
            else {
              this.mensaje = this.getLiteral('runaway_component', 'message_Runaway_LeakStoreProducts');
            }

            if ( currentDocument.lines[0].businessSpecificLineInfo != undefined &&
              currentDocument.lines[0].businessSpecificLineInfo.supplyTransaction == undefined) {
              this.mensaje = this.getLiteral('runaway_component', 'message_Runaway_LeakFuelProductsPosPago');
              return true;
            }
            return currentDocument.lines.filter(x => x.typeArticle.indexOf(parm.meaningfulStringValue) < 0 ).length >= 1;
          }
      } else {
        this.mensaje = this.getLiteral('runaway_component', 'message_Runaway_LeakUnidentifiedCustomer');
        return true;
      }
    } catch (error) {
      this._logHelper.trace('Excepcion runaway - ' + error);
      return true;
    }
    return true;
  }

  getLiteral(group: string, key: string): string {
    return this._languageService.getLiteral(group, key);
  }

}
