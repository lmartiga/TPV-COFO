import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { Subscriber } from 'rxjs/Subscriber';
import { HttpService } from 'app/services/http/http.service';
import { FormatHelper } from 'app/helpers/format-helper';
import { AppDataConfiguration } from 'app/config/app-data.config';
import { SimulateLoyaltyAttributionResponse } from 'app/shared/hubble-pos-web-api-responses/loyalty/simulate-loyalty-attribution-response';
import {
  ProcessLoyaltyAttributionAndRedeemBenefitResponse
} from 'app/shared/hubble-pos-web-api-responses/loyalty/process-loyalty-attribution-and-redeem-benefit-response';

@Injectable()
export class LoyaltyService {

  constructor(
    private _http: HttpService,
    private _config: AppDataConfiguration
  ) {
  }

  simulateLoyaltyAttribution(
    loyaltyCardNumber: string,
    totalAmount: number,
    currencyId: string,
    dateTimeNow: Date,
    description?: string): Observable<SimulateLoyaltyAttributionResponse> {

    return Observable.create((observer: Subscriber<SimulateLoyaltyAttributionResponse>) => {
      this._http.postJsonObservable(`${this._config.apiUrl}/SimulateLoyaltyAttribution`, {
        identity: this._config.userConfiguration.Identity,
        cardNumber: loyaltyCardNumber,
        totalAmount,
        currencyId,
        TransactionClientLocalDateTime: FormatHelper.dateToISOString(dateTimeNow),
      }).subscribe(
        (response: SimulateLoyaltyAttributionResponse) => observer.next(response),
        err => observer.error(err)
      );
    });
  }

  accumulate(
    loyaltyCardNumber: string,
    totalAmount: number,
    currencyId: string,
    simulationDateTime: Date,
    description?: string): Observable<ProcessLoyaltyAttributionAndRedeemBenefitResponse> {

      return Observable.create((observer: Subscriber<ProcessLoyaltyAttributionAndRedeemBenefitResponse>) => {
        this._http.postJsonObservable(`${this._config.apiUrl}/ProcessLoyaltyAttributionAndRedeemBenefit`, {
          identity: this._config.userConfiguration.Identity,
          cardNumber: loyaltyCardNumber,
          totalAmount,
          currencyId,
          TransactionClientLocalDateTime: FormatHelper.dateToISOString(simulationDateTime),
          mustRedeemBenefit: false
        }).subscribe(
            (response: ProcessLoyaltyAttributionAndRedeemBenefitResponse) => observer.next(response),
            err => observer.error(err)
        );
      });
  }

  redeem(
    loyaltyCardNumber: string,
    totalAmount: number,
    currencyId: string,
    dateTimeNow: Date,
    benefitAmountToRedeem: number,
    benefitIdToRedeem: number,
    description?: string): Observable<ProcessLoyaltyAttributionAndRedeemBenefitResponse> {

    return Observable.create((observer: Subscriber<ProcessLoyaltyAttributionAndRedeemBenefitResponse>) => {
      this._http.postJsonObservable(`${this._config.apiUrl}/ProcessLoyaltyAttributionAndRedeemBenefit`, {
        identity: this._config.userConfiguration.Identity,
        cardNumber: loyaltyCardNumber,
        totalAmount,
        currencyId,
        TransactionClientLocalDateTime: FormatHelper.dateToISOString(dateTimeNow),
        mustRedeemBenefit: true,
        benefitAmountToRedeem : benefitAmountToRedeem,
        benefitIdToRedeem: benefitIdToRedeem,

      }).subscribe(
          (response: ProcessLoyaltyAttributionAndRedeemBenefitResponse) => observer.next(response),
          err => observer.next(err)
      );
    });
  }
}
