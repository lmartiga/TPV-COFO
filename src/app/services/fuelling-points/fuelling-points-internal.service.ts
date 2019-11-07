import { Injectable, OnDestroy } from '@angular/core';
import { FuellingPointFormatConfiguration } from 'app/shared/fuelling-point/fuelling-point-format-configuration';
import { AppDataConfiguration } from 'app/config/app-data.config';
import { FormatConfiguration } from 'app/config/format.config';
import { FuellingPointInfo } from 'app/shared/fuelling-point/fuelling-point-info';
import { IDictionaryStringKey } from 'app/shared/idictionary';
import { FuellingPointMainStates } from 'app/shared/fuelling-point/fuelling-point-main-states.enum';
import { ServiceModeType } from 'app/shared/fuelling-point/service-mode-type.enum';
import { GradeConfiguration } from 'app/shared/fuelling-point/grade-configuration';
import { FuellingPointsSignalrUpdatesService } from 'app/services/fuelling-points/fuelling-points-signalr-updates.service';
import { SuplyTransaction } from 'app/shared/fuelling-point/suply-transaction';
import { SuplyTransactionType } from 'app/shared/fuelling-point/suply-transaction-type.enum';
import { Subscription } from 'rxjs/Subscription';
import { ForecourtIdsAndPoscodeInformation } from 'app/shared/fuelling-point/forecourt-ids-and-poscode-information';
import { DocumentInternalService } from 'app/services/document/document-internal.service';
import { FuellingPointModeOperationChangedArgs } from 'app/shared/signalr-server-responses/multiTpvHub/fuelling-point-mode-operation-changed-args';
import { Subject } from 'rxjs/Subject';
import { Observable } from 'rxjs/Observable';
import { LogHelper } from 'app/helpers/log-helper';

@Injectable()
export class FuellingPointsInternalService implements OnDestroy {
  minorTeenFuellingPoint: boolean = false;
  private _gradeList: Array<GradeConfiguration>;
  private _forecourtIdsInfo: ForecourtIdsAndPoscodeInformation;
  private _subscriptions: Subscription[] = [];
  private _fpListInternalSubject: Subject<Array<FuellingPointInfo>> = new Subject();
  private _fpSuplyTransaction: Subject<Array<SuplyTransaction>> = new Subject();
  private _fpSuplyTransactionVirtual: Subject<Array<SuplyTransaction>> = new Subject();
  private _fpInfo: Subject<FuellingPointInfo> = new Subject();
  private _fpClickSuplyTransaction: Subject<boolean> = new Subject();
  _updateSuplyTransactionsVirtual: Subject<number> = new Subject();
  $updateSuplyTransactionsVirtual = this._updateSuplyTransactionsVirtual.asObservable();
  fpListInternal: Array<FuellingPointInfo>;
  private _fpUpdateModeOperationSubject: Subject<FuellingPointModeOperationChangedArgs> = new Subject();
  private _fpSuppliesAnulatedRedSubject: Subject<boolean> = new Subject<boolean>();
  fpSuppliesAnulatedRedSubject$ = this._fpSuppliesAnulatedRedSubject.asObservable();
  private _fpStopButton: Subject<boolean> = new Subject<boolean>();
  fpStopButton$ = this._fpStopButton.asObservable();

  constructor(
    private _appData: AppDataConfiguration,
    private _formatConfig: FormatConfiguration,
    private _fpSinalRResponse: FuellingPointsSignalrUpdatesService,
    private _docInternalSvc: DocumentInternalService,
    private  _logHelper: LogHelper
  ) {
    this._subscriptions.push(this._fpSinalRResponse.onGradeConfiguration()
      .subscribe(response => {
        this._gradeList = response;
      }));
    this._subscriptions.push(this._fpSinalRResponse.onForecourtIdsAndPoscodeInformation()
      .subscribe(response => {
        this._forecourtIdsInfo = response;
      }));
      this._subscriptions.push(this._fpSinalRResponse.onAllFuellingPoints()
      .subscribe(response => {
        if (response.length <= 10) {
          this.minorTeenFuellingPoint = true;
        } else {
          this.minorTeenFuellingPoint = false;
        }
      }));
  }

  ngOnDestroy(): void {
    this._subscriptions.forEach(sub => sub.unsubscribe());
  }

  get formatConfiguration(): FuellingPointFormatConfiguration {
    return {
      currency: this._appData.baseCurrency,
      moneyPipeFormat: this._formatConfig.moneyPipeFormat,
      unitPricePipeFormat: this._formatConfig.unitPricePipeFormat,
      unitPriceSymbol: this._formatConfig.unitPriceSymbol,
      volume: this._appData.volume,
      volumePipeFormat: this._formatConfig.volumePipeFormat
    };
  }
  getPOSId(forecourtPOSId: number): string {
    return this._forecourtIdsInfo.forecourIdToPosCode[forecourtPOSId];
  }
  get ownForecourtPOSId(): number {
    return this._forecourtIdsInfo.ownForecourtPOSId;
  }
  getNgClassBackGroundColor(fuellingPointInfo: FuellingPointInfo): IDictionaryStringKey<boolean> {
    try {
      if (this.minorTeenFuellingPoint) {
         jQuery('.pump-item').css('width', '48%');
      }
      /**PRIORIDAD */
      if (!fuellingPointInfo.isOnline) {
        return this.buildJsonNgClass('mat-offline');
      }
      if (fuellingPointInfo.isStopped) {
        return this.buildJsonNgClass('mat-stop');
      }
      if (fuellingPointInfo.isInErrorState) {
        return this.buildJsonNgClass('mat-error');
      }

      if (fuellingPointInfo.isAttend) {
        fuellingPointInfo.serviceModeType = ServiceModeType.AttendPaid;
      }

      if (fuellingPointInfo.isPreAuthorized) {
        fuellingPointInfo.serviceModeType = ServiceModeType.PreAuthorized;
      }

      switch (fuellingPointInfo.serviceModeType) {
        case ServiceModeType.PrePaid:
          if (fuellingPointInfo.mainState == FuellingPointMainStates.Calling) {
            return this.buildJsonNgClass('mat-FlickerPrepago');
          } else {
            return this.buildJsonNgClass('mat-prepay');
          }
        case ServiceModeType.PostPaid:
          return this.buildJsonNgClass('mat-free');
        case ServiceModeType.WayletPaid:
          return this.buildJsonNgClass('mat-mix');
        case ServiceModeType.AttendPaid:
          return this.buildJsonNgClass('mat-atend');
        case ServiceModeType.PreAuthorized:
          if (fuellingPointInfo.mainState == FuellingPointMainStates.Calling) {
            return this.buildJsonNgClass('mat-Flicker');
          }
          else {
            return this.buildJsonNgClass('mat-preauthorized');
          }
        case ServiceModeType.Other:
        default:
          return this.buildJsonNgClass('mat-mix');
      }
    } catch (error) {
      this._logHelper.trace(error);
      const ret: IDictionaryStringKey<boolean> = {};
      return ret;
    }
  }

  getNgClassIcon(fuellingPointInfo: FuellingPointInfo): IDictionaryStringKey<boolean> {
    try {
    /** estados prioritarios */
    if (fuellingPointInfo.isStopped) {
      // esta parado
      return this.buildJsonNgClass('ic-stop');
    }
    if (fuellingPointInfo.isInErrorState) {
      //  no está parado, pero esta en error
      return this.buildJsonNgClass('ic-alert');
    }
    if (!fuellingPointInfo.isOnline) {
      // esta offline
      return this.buildJsonNgClass('ic-offline');
    }
    if (!fuellingPointInfo.hasFreeBuffer) {
      // buffer lleno
      return this.buildJsonNgClass('ic-wait');
    }
    /* fin estados prioritarios */

    if (fuellingPointInfo.mainState == FuellingPointMainStates.Calling
      || fuellingPointInfo.mainState == FuellingPointMainStates.Starting) {
      return this.buildJsonNgClass('ic-boquerel');
    }
    if (fuellingPointInfo.mainState == FuellingPointMainStates.Fuelling) {
      return this.buildJsonNgClass('ic-boquerel-drop');
    }
    if ((fuellingPointInfo.mainState == FuellingPointMainStates.Idle)
      && (fuellingPointInfo.lockingPOSId != undefined)) {
      // reservado
      return this.buildJsonNgClass('ic-reserved');
    }
    /*if (fuellingPointInfo.mainState == FuellingPointMainStates.Authorized) {
      // autorizado
      return this.buildJsonNgClass('ic-thumb-up');
    }*/
    // default sin icono
    return this.buildJsonNgClass('visibleHidden');
    } catch (error) {
      this._logHelper.trace(error);
      const ret: IDictionaryStringKey<boolean> = {};
      return ret;
    }
  }

  getNgClassTransactionIcon(fuellingPointInfo: FuellingPointInfo, hasTransactions: boolean): IDictionaryStringKey<boolean> {
    if (hasTransactions) {
      return this.buildJsonNgClass('ic-wait');
    }
    return this.buildJsonNgClass('visibleHidden');
  }
  getNgClassSupplyTransactionBackground(operation: SuplyTransaction, isLockingPosid: boolean = false): IDictionaryStringKey<boolean> {
    try {
    let strTransactionClass = 'transactionLocked';
    switch (operation.type) {
      case SuplyTransactionType.PostpaidLockedByOtherPOS:
      case SuplyTransactionType.PrepaidCompleteLockedByOtherPOS:
      case SuplyTransactionType.WayletpaidCompleteLockedByOtherPOS:
      case SuplyTransactionType.Other:
        strTransactionClass = 'transactionLocked';
        break;
      case SuplyTransactionType.PostpaidNoLocked:
      case SuplyTransactionType.PostpaidLockedByOwnPOS:
      case SuplyTransactionType.PrepaidCompleteNotLocked:
      case SuplyTransactionType.PrepaidCompleteLockedByOwnPOS:
      case SuplyTransactionType.WayletpaidCompleteNotLocked:
      case SuplyTransactionType.WayletpaidCompleteLockedByOwnPOS:
      strTransactionClass = 'mat-free';
        break;
      case SuplyTransactionType.PrepaidParcialLockedByOtherPOS:
      case SuplyTransactionType.PrepaidParcialNotLocked:
        strTransactionClass = 'transactionLocked';
        break;
      case SuplyTransactionType.PrepaidParcialLockedByOwnPOS:
        strTransactionClass = 'mat-prepay';
        break;
      default:
        strTransactionClass = 'transactionLocked';
    }
    if ( isLockingPosid) {
      if (this._docInternalSvc.hasTransactionLockingPosId(operation)) {
        strTransactionClass = 'transactionLocked';
      }
    } else {
      if (this._docInternalSvc.hasTransaction(operation)) {
        strTransactionClass = 'transactionLocked';
      }
    }
    return this.buildJsonNgClass(strTransactionClass);
    } catch (error) {
      this._logHelper.trace(error);
      const ret: IDictionaryStringKey<boolean> = {};
      return ret;
    }
  }
  getImgFromGrade(gradeId: number): string {
    if (this._gradeList == undefined) {
      return '';
    }
    const grade = this._gradeList.find(g => g.id == gradeId);
    return grade != undefined ? grade.imageHtmlBase64 : '';
  }
  getProductReferenceFromByGradeId(gradeId: number): string {
    if (this._gradeList == undefined) {
      return '';
    }
    const grade = this._gradeList.find(g => g.id == gradeId);
    return grade != undefined ? grade.productReference : '';
  }
  getDescriptionFromGrade(gradeId: number): string {
    if (this._gradeList == undefined) {
      return '';
    }
    const grade = this._gradeList.find(g => g.id == gradeId);
    return grade != undefined ? grade.name : '';
  }

  private buildJsonNgClass(key: string, check = true): IDictionaryStringKey<boolean> {
    const ret: IDictionaryStringKey<boolean> = {};
    ret[key] = check;
    return ret;
  }

  updateAllFuellingPointsFromComponent(fpList: Array<FuellingPointInfo>) {
    this._fpListInternalSubject.next(fpList);
  }
  onAllFuellingPointsFromComponent(): Observable<Array<FuellingPointInfo>> {
    return this._fpListInternalSubject.asObservable();
  }
  updateAllSuplyTransactionFromComponent(fpListSuplyTransaction: Array<SuplyTransaction>) {
    this._fpSuplyTransaction.next(fpListSuplyTransaction);
  }
  onAllSuplyTransactionFromComponent(): Observable<Array<SuplyTransaction>> {
    return this._fpSuplyTransaction.asObservable();
  }
  updateAllSuplyTransactionVirtualFromComponent(fpListSuplyTransactionVirtual: Array<SuplyTransaction>) {
    this._fpSuplyTransactionVirtual.next(fpListSuplyTransactionVirtual);
  }
  onAllSuplyTransactionVirtualFromComponent(): Observable<Array<SuplyTransaction>> {
    return this._fpSuplyTransactionVirtual.asObservable();
  }
  updateSuplyTransactionsVirtual(update: number) {
    this._updateSuplyTransactionsVirtual.next(update);
  }
  updateFuellingPointFromComponent(fpInfo: FuellingPointInfo) {
    this._fpInfo.next(fpInfo);
  }
  onFuellingPointFromComponent(): Observable<FuellingPointInfo> {
    return this._fpInfo.asObservable();
  }
  onClickSuplyTransactionFromComponent(isclick: boolean) {
    this._fpClickSuplyTransaction.next(isclick);
  }
  clickSuplyTransactionFromComponent(): Observable<boolean> {
    return this._fpClickSuplyTransaction.asObservable();
  }

  updateModeOperationSubject(fp: FuellingPointModeOperationChangedArgs) {
    this._fpUpdateModeOperationSubject.next(fp);
  }
  onUpdateModeOperationSubject(): Observable<FuellingPointModeOperationChangedArgs> {
    return this._fpUpdateModeOperationSubject.asObservable();
  }
  fnSuppliesAnulatedRedSubject(value: boolean) {
    this._fpSuppliesAnulatedRedSubject.next(value);
  }
  fnStopButton(value: boolean) {
    this._fpStopButton.next(value);
  }
  /*
  resizeFuellingPoint() {
      if (window.matchMedia(('(min-width: 1000px)')) && window.matchMedia(('(max-height: 680px)'))) {
      jQuery('.pumpSupplySale').css('margin-top', '93%');
      jQuery('.pumpamountsupplyAuthorization').css('margin-top', '93%');
      jQuery('.tpv-root .mat-button-toggle-standalone, .tpv-root .mat-raised-button').css('font-size', '14px');
      }
      else if (window.matchMedia(('(min-width: 1000px)')) && window.matchMedia(('(max-height: 770px)'))) {
        jQuery('.pumpSupplySale').css('margin-top', '97%');
        jQuery('.pumpamountsupplyAuthorization').css('margin-top', '97%');
        jQuery('.tpv-root .mat-button-toggle-standalone, .tpv-root .mat-raised-button').css('font-size', '14px');
      }
      else if (window.matchMedia(('(min-width: 1000px)')) && window.matchMedia(('(max-height: 770px)'))) {
      }
      else if (window.matchMedia(('(min-width: 1000px)')) && window.matchMedia(('(max-height: 770px)'))) {
      }
  }
  */
}
