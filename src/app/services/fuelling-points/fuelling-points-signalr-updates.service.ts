import { Injectable } from '@angular/core';
import { Subject } from 'rxjs/Subject';
import { FuellingPointInfo } from 'app/shared/fuelling-point/fuelling-point-info';
import {
  FuellingPointTransactionCountChangedArgs
} from 'app/shared/fuelling-point/signalR-Response/fuelling-point-transaction-count-changed-args';
import { ConnectionStateChangedArgs } from 'app/shared/fuelling-point/signalR-Response/connection-state-changed-args';
import { Observable } from 'rxjs/Observable';
import { GradeConfiguration } from 'app/shared/fuelling-point/grade-configuration';
import { IDictionaryNumberKey } from 'app/shared/idictionary';
import { ForecourtIdsAndPoscodeInformation } from 'app/shared/fuelling-point/forecourt-ids-and-poscode-information';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { ConnectionStateType } from 'app/shared/fuelling-point/signalR-Response/connection-state-type.enum';

@Injectable()
export class FuellingPointsSignalrUpdatesService {

  private _onFuellingPointUpdate: Subject<FuellingPointInfo> = new Subject();
  private _onAllFuellingPoints: Subject<Array<FuellingPointInfo>> = new Subject();
  private _onfpTransactionCountChange: Subject<FuellingPointTransactionCountChangedArgs> = new Subject();
  private _onConnectionStateChange: BehaviorSubject<ConnectionStateChangedArgs>;
  private _onGradeConfig: Subject<Array<GradeConfiguration>> = new Subject();
  private _onForecourtInfo: Subject<ForecourtIdsAndPoscodeInformation> = new Subject();
  constructor() {
    this._onConnectionStateChange = new BehaviorSubject<ConnectionStateChangedArgs>({
      actualState: ConnectionStateType.Connecting,
      priorState: ConnectionStateType.Connecting
    });
  }
  /********************************************************************
   ***** observables **************************************************
   ********************************************************************/
  onFuellingPointUpdate(): Observable<FuellingPointInfo> {
    return this._onFuellingPointUpdate.asObservable();
  }
  onAllFuellingPoints(): Observable<Array<FuellingPointInfo>> {
    return this._onAllFuellingPoints.asObservable();
  }
  onFuellingPointTransactionCountChange(): Observable<FuellingPointTransactionCountChangedArgs> {
    return this._onfpTransactionCountChange.asObservable();
  }
  onConnectionStateChange(): Observable<ConnectionStateChangedArgs> {
    return this._onConnectionStateChange.asObservable();
  }

  onGradeConfiguration(): Observable<Array<GradeConfiguration>> {
    return this._onGradeConfig.asObservable();
  }
  onForecourtIdsAndPoscodeInformation(): Observable<ForecourtIdsAndPoscodeInformation> {
    return this._onForecourtInfo.asObservable();
  }
  /********************************************************************
 ***** signalR updates from Server ********************************
 ********************************************************************/
  updateFuellingPointFromServer(fp: FuellingPointInfo) {
    this._onFuellingPointUpdate.next(fp);
  }
  updateAllFuellingPointsFromServer(fpList: Array<FuellingPointInfo>) {
    this._onAllFuellingPoints.next(fpList);
  }
  updateFuellingPointTransactionFromServer(param: FuellingPointTransactionCountChangedArgs) {
    this._onfpTransactionCountChange.next(param);
  }
  updateConnectionStateFromServer(param: ConnectionStateChangedArgs) {
    this._onConnectionStateChange.next(param);
  }
  updateGradeConfigurationFromServer(param: Array<GradeConfiguration>) {
    this._onGradeConfig.next(param);
  }
  updateForeCourtIdDictionaryFromServer(dictionary: IDictionaryNumberKey<string>, ownPosCode: number) {
    this._onForecourtInfo.next({
      ownForecourtPOSId: ownPosCode,
      forecourIdToPosCode: dictionary
    });
  }
}
