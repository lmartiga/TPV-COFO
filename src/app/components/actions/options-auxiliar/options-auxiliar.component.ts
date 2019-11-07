import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { Subscription } from 'rxjs/Subscription';
import { FuellingPointsService } from 'app/services/fuelling-points/fuelling-points.service';
import { ChangePaymentInternalService } from 'app/services/payments/change-payment-internal.service';
import { SessionInternalService } from 'app/services/session/session-internal.service';
import { PluService } from 'app/services/plu/plu.service';
import { LanguageService } from 'app/services/language/language.service';
import { DocumentInternalService } from 'app/services/document/document-internal.service';
import { OperatorService } from 'app/services/operator/operator.service';
import { SignalRMultiTPVService } from 'app/services/signalr/signalr-multitpv.service';
import { MinimumNeededConfiguration } from 'app/config/minimum-needed.config';
@Component({
  selector: 'tpv-options-auxiliar',
  templateUrl: './options-auxiliar.component.html',
  styleUrls: ['./options-auxiliar.component.scss']
})
export class OptionsAuxiliarComponent implements OnInit, OnDestroy {
  @Input() origen: string;
  blnActiveReturn: boolean = false;
  _subscriptions: Subscription[] = [];
  btnStopChecked: boolean = false;
  parar: string;
  activar: string;

  btnStopDisabled: boolean = false;

  constructor(
    private _changeDelivered: ChangePaymentInternalService,
    private _fuellingPointsSvc: FuellingPointsService,
    private _session: SessionInternalService,
    private _pluService: PluService,
    private _languageService: LanguageService,
    private _documentInternalService: DocumentInternalService,
    private _operatorService: OperatorService,
    private _multiTpvSvc: SignalRMultiTPVService,
    private _conf: MinimumNeededConfiguration,
  ) { }

  ngOnInit() {

    this._subscriptions.push(this._changeDelivered.estadoParar$.subscribe(d => {
      this.btnStopChecked = d;
      setTimeout(() => {
        if (this.btnStopChecked) {
          jQuery('.button_Alert_right').css('background-color', '#6a972c');
        } else {
          jQuery('.button_Alert_right').css('background-color', '#e40028');
        }
      }, 1);
    }));

    this._subscriptions.push(this._changeDelivered.changedPayment$.subscribe(data => {
      this.blnActiveReturn = !data.isButtonHidden;
    }));

    this.parar = this.getLiteral('options_auxiliar', 'stop_checked');
    this.activar = this.getLiteral('options_auxiliar', 'Activate_checked');

    if(this.origen == "actions") {
      this._subscriptions.push(this._operatorService.escucharOperador().subscribe(
      data => {
        this._multiTpvSvc.requestOperatorChangedRedTPV(this._conf.POSInformation.code, undefined).first()
        .subscribe( response => {
          const bExistOperator = this._operatorService.fnExistOperatorMultiTpv();
          if (bExistOperator == false) {
            this.btnStopDisabled = !bExistOperator; // true;
            this._fuellingPointsSvc.emergencyStop().first().subscribe();
          }
        });
      }));

      this._subscriptions.push(this._operatorService.escucharOperadorAcept().subscribe(
      data => {
        this._multiTpvSvc.requestOperatorChangedRedTPV(this._conf.POSInformation.code,
          '123456').first()
        .subscribe( response => {
          const bExistOperator = this._operatorService.fnExistOperatorMultiTpv();
          if (bExistOperator == true) {
            if (this.btnStopDisabled == bExistOperator) { // true
                this.btnStopDisabled = !bExistOperator; // false
                this._fuellingPointsSvc.cancelEmergencyStop().first().subscribe();
              }
            }
        });
      }));
    }
  }

  ngOnDestroy() {
    this._subscriptions.forEach(p => p.unsubscribe());
  }

  btnStopclick() {
    this._subscriptions.push(this._fuellingPointsSvc.manageRequestEmergencyStop(!this.btnStopChecked)
      .first().subscribe());
    if (jQuery('md-drawer').hasClass('open-side-bar')) {
      this._session.onClickStopDispenser(this.btnStopChecked);
    }
  }

  fnReturn() {
    this._documentInternalService.currentDocument.BarcodeStatus = false;
    this._changeDelivered.fnReturn(true);
    this._pluService.canSearchWithBarcode = true; // Pana - Para poder buscar con el lector
    jQuery('.selecArticulo').css('background-color', '#ffffff');
    jQuery('.buttonCancel').css('background-image', 'linear-gradient(104deg, #aca39a 78%, #ffffff 0%)');
  }
  getLiteral(group: string, key: string): string {
    return this._languageService.getLiteral(group, key);
  }
}
