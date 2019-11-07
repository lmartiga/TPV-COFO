import { Component, OnInit, Input, SimpleChanges, OnChanges, Output, EventEmitter } from '@angular/core';
import { FuellingPointInfo } from 'app/shared/fuelling-point/fuelling-point-info';
import { FuellingLimitType } from 'app/shared/fuelling-point/fuelling-limit-type.enum';
import { IDictionaryStringKey } from 'app/shared/idictionary';
import { FuellingPointFormatConfiguration } from 'app/shared/fuelling-point/fuelling-point-format-configuration';
import { FuellingPointsInternalService } from 'app/services/fuelling-points/fuelling-points-internal.service';
import { SignalRPSSService } from 'app/services/signalr/signalr-pss.service';
import { StatusBarService } from 'app/services/status-bar/status-bar.service';
import { LanguageService } from 'app/services/language/language.service';
import { FuellingPointsService } from 'app/services/fuelling-points/fuelling-points.service';
import { ServiceModeType } from 'app/shared/fuelling-point/service-mode-type.enum';
import { MinimumNeededConfiguration } from 'app/config/minimum-needed.config';
import { FuellingPointMainStates } from 'app/shared/fuelling-point/fuelling-point-main-states.enum';
import { LogHelper } from 'app/helpers/log-helper';


@Component({
  selector: 'tpv-pump-aux',
  templateUrl: './pump-aux.component.html',
  styleUrls: ['./pump-aux.component.scss']
})
export class PumpAuxComponent implements OnInit, OnChanges {
  @Input()
  fuellingPointInfo: FuellingPointInfo;
  @Output() cerrar: EventEmitter<boolean>;
  formatConfig: FuellingPointFormatConfiguration;

  // usado para mostrar el producto en uso
  fuellingProductData: {
    unitaryPrice?: number;
    gradeId?: number;
  };

  // usado para indicar que simbolo se usa de limite (segun el tipo: volumen o moneda)
  limitSymbol: string;
  // uado para indicar el formato del limite segun el tipo
  limitFormatter: string;

  constructor(
    private _internalSvc: FuellingPointsInternalService,
    private _signalr: SignalRPSSService,
    private _statusBarService: StatusBarService,
    private _languageService: LanguageService,
    private _fpSvc: FuellingPointsService,
    private _conf: MinimumNeededConfiguration,
    private  _logHelper: LogHelper
  ) {
    this.formatConfig = this._internalSvc.formatConfiguration;
    this.cerrar = new EventEmitter();
   }

  ngOnInit() {
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.fuellingPointInfo != undefined) {
      this.setData();
    }
  }

  private setData() {
    try {
      switch (this.fuellingPointInfo.limitType) {
        case FuellingLimitType.Monetary:
          this.limitFormatter = this.formatConfig.moneyPipeFormat;
          this.limitSymbol = this.formatConfig.currency.symbol;
          break;
        case FuellingLimitType.Volume:
          this.limitFormatter = this.formatConfig.volumePipeFormat;
          this.limitSymbol = this.formatConfig.volume.symbol;
          break;
        default: break;
      }

      this.fuellingProductData = {
        gradeId: this.fuellingPointInfo.limitGradeId,
        unitaryPrice: this.fuellingPointInfo.limitProductUnitaryPrice
      };
    } catch (error) {
      this._logHelper.trace('Error en Pump-aux', error);
    }
  }
  btnFuellingPointClick() {
    try {
          const fpTransferOrigen: FuellingPointInfo = this._internalSvc.fpListInternal.find(x => x.id == this.fuellingPointInfo.idfpTransferOrigen);
          if (fpTransferOrigen.mainState == FuellingPointMainStates.Calling || fpTransferOrigen.mainState == FuellingPointMainStates.Starting) {
            this._statusBarService.publishMessage('Es necesario colgar la manguera del surtidor origen para transferir.');
            return;
          }

          const fpTransferDestino: FuellingPointInfo = this._internalSvc.fpListInternal.find(x => x.id == this.fuellingPointInfo.id);
          if (fpTransferDestino.mainState == FuellingPointMainStates.Calling || fpTransferDestino.mainState == FuellingPointMainStates.Starting) {
            this._statusBarService.publishMessage('Es necesario colgar la manguera del surtidor destino para transferir.');
            return;
          }

          this._fpSvc.requestChangeServiceModeMultiTPV(fpTransferOrigen.oldServiceModeType, fpTransferOrigen.id,
            this._conf.POSInformation.code,  fpTransferOrigen.oldHasPostPaidTransaction, fpTransferOrigen.oldHasPrePaidTransaction,
            fpTransferOrigen.serviceModeType, fpTransferOrigen.hasPostPaidTransaction, fpTransferOrigen.hasPrePaidTransaction
            )
          .first().subscribe(responseMulti => {
            // this._signalr.requestChangeServiceMode(fpTransferOrigen.oldServiceModeType, fpTransferOrigen.id, '')
            // .first().subscribe( response2 => {
              this._fpSvc.requestChangeServiceModeMultiTPV(ServiceModeType.PrePaid, this.fuellingPointInfo.id,
                this._conf.POSInformation.code,  false, true,
                this.fuellingPointInfo.serviceModeType,
                this.fuellingPointInfo.hasPostPaidTransaction,
                this.fuellingPointInfo.hasPrePaidTransaction)
              .first().subscribe(responseMulti => {
                this._signalr.ChangeSalePrepayOtherFuellingPoint(this.fuellingPointInfo.idfpTransferOrigen, this.fuellingPointInfo.id)
                .first()
                .subscribe( response => {
                  if (response.status == 1) {
                     this._statusBarService.publishMessage(this.getLiteral('pump_aux_component', 'literal_statusbar_transfer'));
                  } else {
                    const sMessage = response.message.split('-');
                    this._statusBarService.publishMessage(sMessage[0]);
                  }
                },
                error => {
                  this._logHelper.trace('Error en ChangeSalePrepayOtherFuellingPoint');
                });
              });
            //});
          });
      this.cerrar.emit(true);
      } catch (error) {
      this._logHelper.trace(this.getLiteral('pump_aux_component', 'literal_statusbar_transferError'));
      }
  }

  setClassButton(): IDictionaryStringKey<boolean> {
    return this._internalSvc.getNgClassBackGroundColor(this.fuellingPointInfo);
  }
  setClassIcon(): IDictionaryStringKey<boolean> {
    return this._internalSvc.getNgClassIcon(this.fuellingPointInfo);
  }
  setClassTransactionIcon(): IDictionaryStringKey<boolean> {
    return this._internalSvc.getNgClassTransactionIcon(this.fuellingPointInfo, this.fuellingPointInfo.hasTransactions);
  }
  srcGrade(): string {
    return this._internalSvc.getImgFromGrade(this.fuellingProductData.gradeId);
  }

  getLiteral(group: string, key: string): string {
    return this._languageService.getLiteral(group, key);
  }
}
