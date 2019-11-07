import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { Subject } from 'rxjs/Subject';
import { FuellingTank } from 'app/shared/fuelling-point/fuelling-tank';
import { SuplyTransaction } from 'app/shared/fuelling-point/suply-transaction';
import { AppDataConfiguration } from 'app/config/app-data.config';
import { HttpService } from 'app/services/http/http.service';
import { GetFuellingTanksResponse
} from 'app/shared/web-api-responses/get-fuelling-tanks-response';
import {
  GetFuellingTanksResponseStatuses
} from 'app/shared/web-api-responses/get-fuelling-tanks-statuses.enum';
import {
  GetFuellingTankByFuellingPointIdAndGradeReferenceResponse
} from 'app/shared/web-api-responses/get-fuelling-tank-by-fuelling-point-id-and-grade-reference-response';
import {
  GetFuellingTankByFuellingPointIdAndGradeReferenceStatuses
} from 'app/shared/web-api-responses/get-fuelling-tank-by-fuelling-point-id-and-grade-reference-statuses.enum';
import { LogHelper } from 'app/helpers/log-helper';

@Injectable()
export class FuellingPointTestService {
  private _getFuelTanksRequested: Subject<FuellingTank[]> = new Subject();
  private _getFuellingTankByFuellingPointIdAndGradeReferenceRequested: Subject<FuellingTank> = new Subject();

  constructor(
    private _http: HttpService,
    private _config: AppDataConfiguration,
    private _logHelper: LogHelper,
  ) {
  }

  availableFuelTanks(supplyTransaction: SuplyTransaction): Observable<FuellingTank[]> {
    const request = {identity: this._config.userConfiguration.Identity,
                    gradeReference: supplyTransaction.gradeReference};
      this._http.postJsonObservable(`${this._config.apiUrl}/GetFuellingTanks`, request)
      .first().subscribe((response: GetFuellingTanksResponse) => {
        if (response.status == GetFuellingTanksResponseStatuses.successful) {
          this._getFuelTanksRequested.next(response.availableFuellingTanks);
        } else {
          this._logHelper.trace(
            `La respuesta ha sido negativa: ${GetFuellingTanksResponseStatuses[response.status]}. Mensaje: ${response.message}`);
          this._getFuelTanksRequested.next(undefined);
        }
      },
      error => {
        this._logHelper.trace(
          `Se produjo un error al solicitar la ejecución del servicio GetFuellingTanks: ${error}`);
        this._getFuelTanksRequested.next(undefined);
    });
    return this._getFuelTanksRequested.asObservable();
  }

  getFuellingTankBySupplyTransaction(supplyTransaction: SuplyTransaction): Observable<FuellingTank> {
    const request = {identity: this._config.userConfiguration.Identity,
                    fuellingPointId: supplyTransaction.fuellingPointId,
                    gradeReference: supplyTransaction.gradeReference};
      this._http.postJsonObservable(`${this._config.apiUrl}/GetFuellingTankByFuellingPointIdAndGradeReference`, request)
      .first().subscribe((response: GetFuellingTankByFuellingPointIdAndGradeReferenceResponse) => {
        if (response.status == GetFuellingTankByFuellingPointIdAndGradeReferenceStatuses.successful) {
          this._getFuellingTankByFuellingPointIdAndGradeReferenceRequested.next(response.fuellingTank);
        } else {
          this._logHelper.trace(
            `La respuesta ha sido negativa: ${GetFuellingTankByFuellingPointIdAndGradeReferenceStatuses[response.status]}.
            Mensaje: ${response.message}`);
          this._getFuellingTankByFuellingPointIdAndGradeReferenceRequested.next(undefined);
        }
      },
      error => {
        this._logHelper.trace(
          `Se produjo un error al solicitar la ejecución del servicio GetFuellingTankByFuellingPointIdAndGradeReference: ${error}`);
        this._getFuellingTankByFuellingPointIdAndGradeReferenceRequested.next(undefined);
    });
    return this._getFuellingTankByFuellingPointIdAndGradeReferenceRequested.asObservable();
  }
}
