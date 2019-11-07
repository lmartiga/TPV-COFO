import { Component, OnInit, Input, Output, EventEmitter, SimpleChanges } from '@angular/core';
import { FuellingPointInfo } from 'app/shared/fuelling-point/fuelling-point-info';
import { FuellingPointMainStates } from 'app/shared/fuelling-point/fuelling-point-main-states.enum';
import { FuellingLimitType } from 'app/shared/fuelling-point/fuelling-limit-type.enum';
import { OnChanges, OnDestroy } from '@angular/core/src/metadata/lifecycle_hooks';
import { IDictionaryStringKey } from 'app/shared/idictionary';
import { FuellingPointFormatConfiguration } from 'app/shared/fuelling-point/fuelling-point-format-configuration';
import { FuellingPointsInternalService } from 'app/services/fuelling-points/fuelling-points-internal.service';
import { ServiceModeType } from 'app/shared/fuelling-point/service-mode-type.enum';
import { FuellingPointsService } from 'app/services/fuelling-points/fuelling-points.service';
import { Subject } from 'rxjs/Subject';
import { Globals } from 'app/services/Globals/Globals';
import { SuplyTransaction } from 'app/shared/fuelling-point/suply-transaction';
import { LanguageService } from 'app/services/language/language.service';
import { MinimumNeededConfiguration } from 'app/config/minimum-needed.config';
import { Subscription } from 'rxjs';
import { OperatorInternalService } from 'app/services/operator/operator-internal.service';

@Component({
  selector: 'tpv-pump',
  templateUrl: './pump.component.html',
  styleUrls: ['./pump.component.scss']
})
export class PumpComponent implements OnInit, OnChanges, OnDestroy {
  @Output() fpSelectedEvent = new EventEmitter<FuellingPointInfo>();
  @Input()
  fuellingPointInfo: FuellingPointInfo;
  @Input()
  fpSupplyTransaction: Array<SuplyTransaction>;

  @Input()
  formatConfig: FuellingPointFormatConfiguration;

  @Input() isTicket: boolean;

  @Input() isCreditCardPayment: boolean;
  // usado para mostrar el suministro actual (live)
  fuellingData: {
    vol?: number;
    amount?: number;
  };
  fuellingDataInitial: {
    vol: number;
    amount: number;
  };
  // usado para mostrar el producto en uso
  fuellingProductData: {
    unitaryPrice?: number;
    gradeId?: number;
  };
  supplyTransactions: Array<SuplyTransaction>;
  private _subscriptions: Subscription[] = [];
  isSupplyAuthorized: boolean;
  precio: string;
  // usado para indicar que simbolo se usa de limite (segun el tipo: volumen o moneda)
  limitSymbol: string;
  // uado para indicar el formato del limite segun el tipo
  limitFormatter: string;
  preventSingleClick = false;
  timer: any;
  delay: Number;
  private _onFuellingPointAuxiliarActionsComplete: Subject<boolean> = new Subject();
  hasTransactions: boolean = false;

  limitTypeMonetary: FuellingLimitType;

  constructor(
    private _internalSvc: FuellingPointsInternalService,
    private _fpSvc: FuellingPointsService,
    private _languageService: LanguageService,
    private _conf: MinimumNeededConfiguration,
    private _operatorInternalSvc: OperatorInternalService,
  ) {
  }

  ngOnInit() {
    this.limitTypeMonetary = FuellingLimitType.Monetary;

    this._subscriptions.push(this._internalSvc.onAllSuplyTransactionFromComponent()
      .subscribe((data: Array<SuplyTransaction>) => {
        if (this.fuellingPointInfo) {
          if ((this.fuellingPointInfo.mainState === FuellingPointMainStates.Idle ||
            this.fuellingPointInfo.mainState === FuellingPointMainStates.Unavailable) &&
            this.fuellingPointInfo.lockingPOSId == undefined && this.fuellingPointInfo.isOnline &&
            !this.fuellingPointInfo.isInErrorState && !this.fuellingPointInfo.isStopped) {
              if (data) {
                // tslint:disable-next-line:max-line-length
                const suplyTransact = data.filter(x => x.fuellingPointId == this.fuellingPointInfo.id && (!x.lockingPOSId || x.fuellingLimitValue > 0));
                if (suplyTransact) {
                    this.supplyTransactions = suplyTransact;
                }
              } else {
                this.supplyTransactions = undefined;
              }
            } else {
              this.supplyTransactions = undefined;
            }
        }
    }));
    // const time = TimerObservable.create(0, 20000);
    //  this.subscription = time.subscribe(t => {
    //   this.SetHasTransactions();
    // });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.fuellingPointInfo != undefined) {
      this.setData();
    }
    if (changes.fpSupplyTransaction != undefined) {
      if (this.fuellingPointInfo) {
      if ((this.fuellingPointInfo.mainState === FuellingPointMainStates.Idle ||
        this.fuellingPointInfo.mainState === FuellingPointMainStates.Unavailable) &&
        this.fuellingPointInfo.lockingPOSId == undefined && this.fuellingPointInfo.isOnline &&
        !this.fuellingPointInfo.isInErrorState && !this.fuellingPointInfo.isStopped) {
          if (this.fpSupplyTransaction) {
            // tslint:disable-next-line:max-line-length
            const suplyTransact = this.fpSupplyTransaction.filter(x => x.fuellingPointId == this.fuellingPointInfo.id && (!x.lockingPOSId || x.fuellingLimitValue > 0));
            if (suplyTransact) {
                this.supplyTransactions = suplyTransact;
            }
          } else {
            this.supplyTransactions = undefined;
          }
        } else {
          this.supplyTransactions = undefined;
        }
      }
    }
  }

  private SetHasTransactions(): void {
    try {
      const fuel = Globals.Get().find(x => x.id === this.fuellingPointInfo.id);

      this.hasTransactions = fuel !== undefined && fuel !== null ? fuel.status : false;
    } catch (error) {
      // this._logHelper.trace(error);
    }
  }

  private setData() {
    const hasLimit = this.fuellingPointInfo.hasSupplyLimit
      && this.fuellingPointInfo.limitValue != undefined
      && this.fuellingPointInfo.limitType != undefined;
    if (hasLimit) {
      switch (this.fuellingPointInfo.limitType) {
        case FuellingLimitType.Monetary:
          this.limitFormatter = this.formatConfig.moneyPipeFormat;
          this.limitSymbol = this.formatConfig.currency.symbol;
          break;
        case FuellingLimitType.Volume:
          this.limitFormatter = this.formatConfig.volumePipeFormat;
          this.limitSymbol = this.formatConfig.volume.symbol;
          break;
        default:
          break;
      }
    }
    if (this.fuellingPointInfo.mainState == FuellingPointMainStates.Starting && this.fuellingPointInfo.isPreAuthorized) {
      const respuesta = {amount: 0, vol: 0};
      this.fuellingDataInitial = respuesta;
    } else {
      this.fuellingDataInitial = undefined;
    }
    if (this.fuellingPointInfo.mainState != FuellingPointMainStates.Fuelling
      || (this.fuellingPointInfo.fuellingDataVolume == undefined && this.fuellingPointInfo.fuellingDataMonetary == undefined)) {
      // solo pintara datos si esta en fuelling
      this.fuellingData = undefined;
    } else {
      if (this.fuellingPointInfo.fuellingDataMonetary != undefined && this.fuellingPointInfo.fuellingDataMonetary > 0) {
        if (this.fuellingData == undefined) {
          this.fuellingData = {};
        }
        if (hasLimit) {
          // tslint:disable-next-line:max-line-length
          this.fuellingData.amount = this.fuellingPointInfo.limitType === FuellingLimitType.Monetary ? this.fuellingPointInfo.fuellingDataMonetary - this.fuellingPointInfo.limitValue : this.fuellingPointInfo.fuellingDataMonetary - (this.fuellingPointInfo.limitProductUnitaryPrice * this.fuellingPointInfo.limitValue);
        }
        else {
          this.fuellingData.amount = this.fuellingPointInfo.fuellingDataMonetary;
        }
      }
      if (this.fuellingPointInfo.fuellingDataVolume != undefined && this.fuellingPointInfo.fuellingDataVolume > 0) {
        if (this.fuellingData == undefined) {
          this.fuellingData = {};
        }
        this.fuellingData.vol = this.fuellingPointInfo.fuellingDataVolume;
      }
    }
    if (this.fuellingPointInfo.hasSupplyLimit) {
      this.fuellingProductData = {
        gradeId: this.fuellingPointInfo.limitGradeId,
        unitaryPrice: this.fuellingPointInfo.limitProductUnitaryPrice
      };
    } else {
      if (this.fuellingPointInfo.currentGradeId == undefined || this.fuellingPointInfo.currentProductUnitaryPrice == undefined) {
        this.fuellingProductData = undefined;
      } else {
        this.fuellingProductData = {};
        if (this.fuellingPointInfo.currentGradeId != undefined) {
          this.fuellingProductData.gradeId = this.fuellingPointInfo.currentGradeId;
        }
        if (this.fuellingPointInfo.currentProductUnitaryPrice != undefined) {
          this.fuellingProductData.unitaryPrice = this.fuellingPointInfo.currentProductUnitaryPrice;
        }
      }
    }
    if (this.fuellingPointInfo.mainState == FuellingPointMainStates.Calling
      || this.fuellingPointInfo.mainState == FuellingPointMainStates.Starting
      || this.fuellingPointInfo.mainState == FuellingPointMainStates.Fuelling) {
      this.isSupplyAuthorized = false;
    }
    if (this.fuellingPointInfo.isStopped || !this.fuellingPointInfo.isOnline || this.fuellingPointInfo.isInErrorState) {
      this.fuellingData = undefined;
      this.supplyTransactions = undefined;
      this.isSupplyAuthorized = false;
    } else if (this.fuellingPointInfo.mainState == FuellingPointMainStates.Authorized) {
      this.isSupplyAuthorized = true;
      this.supplyTransactions = undefined;
    } else {
      this.isSupplyAuthorized = false;
    }
  }

  textServiceModeWaylet(): string {
    if (this.fuellingPointInfo.serviceModeType == 2) {
      return 'WayletPaid';
    } else {
      return '';
    }
  }


  btnFuellingPointClick() {
    if (this.fuellingPointInfo.isInErrorState || !this.fuellingPointInfo.isOnline || this.isTicket || this.isCreditCardPayment
        || ( this.fuellingPointInfo.isStopped && this.fuellingPointInfo.mainState == FuellingPointMainStates.Unavailable &&
              !this._operatorInternalSvc.fnExistOperatorinTpv(this._conf.POSInformation.code) )
        ) {
      return;
    }
    this.clearOutline();
    this.putOutline(this.fuellingPointInfo.id);
    this.preventSingleClick = false;
    this._internalSvc.onClickSuplyTransactionFromComponent(true);
    const delay = 200;
    this.timer = setTimeout(() => {
      if (!this.preventSingleClick) {
        this.fpSelectedEvent.emit(this.fuellingPointInfo);
      }
    }, delay);
  }

  btnFuellingPointDobleClick() {
    this.preventSingleClick = true;
    clearTimeout(this.timer);
    if (this.fuellingPointInfo != undefined) {
      if (this.fuellingPointInfo.limitValue == undefined
        || this.fuellingPointInfo.limitValue == 0
        || this.fuellingPointInfo.serviceModeType != ServiceModeType.PrePaid) {
        if (this.fuellingPointInfo.mainState == FuellingPointMainStates.Calling && this.fuellingPointInfo.isPreAuthorized) {
          // tslint:disable-next-line:max-line-length
          this._fpSvc.requestChangeServiceModeMultiTPV(this.fuellingPointInfo.serviceModeType, this.fuellingPointInfo.id,
            this._conf.POSInformation.code , this.fuellingPointInfo.hasPostPaidTransaction, this.fuellingPointInfo.hasPrePaidTransaction,
            this.fuellingPointInfo.oldServiceModeType,
            this.fuellingPointInfo.oldHasPostPaidTransaction,
            this.fuellingPointInfo.oldHasPrePaidTransaction)
          .first().subscribe(responsemultiTpv => {
            // tslint:disable-next-line: max-line-length
            this._fpSvc.requestChangeServiceMode(this.fuellingPointInfo.serviceModeType, this.fuellingPointInfo.id, 'message_StatusBar_ServiceModePreAuthorizedAuthSuccessfully')
            .first().subscribe(response => {
              if (!this.isCreditCardPayment) {
                this._onFuellingPointAuxiliarActionsComplete.next(response);
              }
            });
          });
        }/*
        else {
          if (this.fuellingPointInfo.serviceModeType == ServiceModeType.PostPaid
            || this.fuellingPointInfo.serviceModeType == ServiceModeType.PrePaid) {
            let surtidorMode = 1;
            if (this.fuellingPointInfo.serviceModeType == ServiceModeType.PrePaid) {
              // alert('es prepago y cambiara a pos pago');
              surtidorMode = ServiceModeType.PostPaid;
            }

            if (this.fuellingPointInfo.serviceModeType == ServiceModeType.PostPaid) {
              // alert('es pos pago y cambiara a pre pago');
              surtidorMode = ServiceModeType.PrePaid;
            }

            this.fuellingPointInfo.oldServiceModeType = this.fuellingPointInfo.serviceModeType;
            this.fuellingPointInfo.serviceModeType = surtidorMode;
            // tslint:disable-next-line:max-line-length
            // this.fuellingPointInfo.isAttend = ServiceModeType.AttendPaid == surtidorMode ? true : false;
            this._fpSvc.requestChangeServiceModeMultiTPV(this.fuellingPointInfo.serviceModeType,
              this.fuellingPointInfo.id, this._conf.POSInformation.code, this.fuellingPointInfo.hasPostPaidTransaction,
              this.fuellingPointInfo.hasPrePaidTransaction,
              this.fuellingPointInfo.oldServiceModeType,
              this.fuellingPointInfo.oldHasPostPaidTransaction,
              this.fuellingPointInfo.oldHasPrePaidTransaction
              )
            .first().subscribe(responsemultiTpv => {
              this._fpSvc.requestChangeServiceMode(surtidorMode, this.fuellingPointInfo.id)
              .first().subscribe(response => {
                if (!this.isCreditCardPayment) {
                  this._onFuellingPointAuxiliarActionsComplete.next(response);
                }
              });
            });

          }
        }
        */
      }
    }/*
    else {
      if (this.fuellingPointInfo.serviceModeType == ServiceModeType.PostPaid || this.fuellingPointInfo.serviceModeType == ServiceModeType.PrePaid) {
        let surtidorMode = 1;
        if (this.fuellingPointInfo.serviceModeType == ServiceModeType.PrePaid) {
          // alert('es prepago y cambiara a pos pago');
          surtidorMode = ServiceModeType.PostPaid;
        }

        if (this.fuellingPointInfo.serviceModeType == ServiceModeType.PostPaid) {
          // alert('es pos pago y cambiara a pre pago');
          surtidorMode = ServiceModeType.PrePaid;
        }
        this.fuellingPointInfo.oldServiceModeType = this.fuellingPointInfo.serviceModeType;
        this.fuellingPointInfo.serviceModeType = surtidorMode;
        // this.fuellingPointInfo.isAttend = ServiceModeType.AttendPaid == surtidorMode ? true : false;
        // tslint:disable-next-line:max-line-length
        this._fpSvc.requestChangeServiceModeMultiTPV(this.fuellingPointInfo.serviceModeType, this.fuellingPointInfo.id,
          this._conf.POSInformation.code, this.fuellingPointInfo.hasPostPaidTransaction, this.fuellingPointInfo.hasPrePaidTransaction,
          this.fuellingPointInfo.oldServiceModeType,
          this.fuellingPointInfo.oldHasPostPaidTransaction,
          this.fuellingPointInfo.oldHasPrePaidTransaction)
        .first().subscribe(responsemultiTpv => {
          this._fpSvc.requestChangeServiceMode(surtidorMode, this.fuellingPointInfo.id)
          .first().subscribe(response => {
            this._onFuellingPointAuxiliarActionsComplete.next(response);
          });
        });


      }
    }
    */
  }

  deleteTransactionVirtual( item: SuplyTransaction) {
      const i = this.supplyTransactions.indexOf( item );
      this.supplyTransactions.splice( i, 1 );
  }

  setClassButton(): IDictionaryStringKey<boolean> {
    return this._internalSvc.getNgClassBackGroundColor(this.fuellingPointInfo);
  }

  setClassIcon(): IDictionaryStringKey<boolean> {
    return this._internalSvc.getNgClassIcon(this.fuellingPointInfo);
  }

  setClassTransactionIcon(): IDictionaryStringKey<boolean> {
    this.SetHasTransactions();
    return this._internalSvc.getNgClassTransactionIcon(this.fuellingPointInfo, this.hasTransactions);
  }

  srcGrade(): string {
    if (this.fuellingProductData != undefined) {
      return this._internalSvc.getImgFromGrade(this.fuellingProductData.gradeId);
    }
    return '';
  }
  getImgFromGrade(idGrade: number): string {
    return this._internalSvc.getImgFromGrade(idGrade);
  }
  setClassSupplyTransaction(operation: SuplyTransaction): IDictionaryStringKey<boolean> {
    return this._internalSvc.getNgClassSupplyTransactionBackground(operation);
  }
  srcGradeById(idGrade: number): string {
    if (idGrade != undefined) {
      return this._internalSvc.getImgFromGrade(idGrade);
    }
    return '';
  }
  putOutline(id: number) {
    jQuery('#pump' + id).css('border', '#041e42 2px solid');
  }
  clearOutline() {
    jQuery('.pump-item').css('border', '0px');
  }
  assignClassPump(val: number): string {
    if (val == 1) {
      return this.supplyTransactions.length == 1 ? 'pumpamountsupplyNoBorder' : 'pumpamountsupply';
    } else {
      return 'content-info-pumps';
    }
  }

  getLiteral(group: string, key: string): string {
    return this._languageService.getLiteral(group, key);
  }

  ngOnDestroy(): void {
    this._subscriptions.forEach(s => s.unsubscribe());
  }

  isPrePayCompleted(): boolean {
      if ( this.supplyTransactions[0].fuellingLimitType === this.limitTypeMonetary ?
          (this.supplyTransactions[0].money != this.supplyTransactions[0].fuellingLimitValue) :
          (this.supplyTransactions[0].money != (this.supplyTransactions[0].fuellingLimitValue * this.supplyTransactions[0].gradeUnitPrice))
         ) { return false; } else { return true; }
  }
}

