import { Component, OnInit, OnDestroy, HostBinding, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { Subject } from 'rxjs/Subject';
import { Observable } from 'rxjs/Observable';
import { IActionFinalizable } from 'app/shared/iaction-finalizable';
import { LoyaltyService } from 'app/services/loyalty/loyalty.service';
import { LoyaltyAttributionSimulationDetails } from 'app/shared/loyalty/loyalty-attribution-simulation-details';
import {
  SimulateLoyaltyAttributionResponse
} from 'app/shared/hubble-pos-web-api-responses/loyalty/simulate-loyalty-attribution-response';
import {
  SimulateLoyaltyAttributionResponseStatuses
} from 'app/shared/hubble-pos-web-api-responses/loyalty/simulate-loyalty-attribution-response-statuses.enum';
import { LoyaltyActionType } from 'app/shared/loyalty/loyalty-action-type.enum';
import { LoyaltyAttributionInformation } from 'app/shared/loyalty/loyalty-attribution-information';
import { KeyboardInternalService } from 'app/services/keyboard/keyboard-internal.service';
import { LogHelper } from 'app/helpers/log-helper';

@Component({
  selector: 'tpv-loyalty',
  templateUrl: './loyalty.component.html',
  styleUrls: ['./loyalty.component.scss']
})
export class LoyaltyComponent implements OnInit, OnDestroy, AfterViewInit, IActionFinalizable<LoyaltyAttributionInformation> {

  @HostBinding('class') class = 'tpv-loyalty';
  @ViewChild('cardNumberInput') cardNumberInput: ElementRef;

  simulationDate: Date;
  errorMessage: string = '';
  searchingForAttributions: boolean = false;
  documentTotalAmount: number = 0;
  documentCurrencyId: string = '';
  loyaltyCardNumber: string = '';
  loyaltyAttributionSimulationDetails: LoyaltyAttributionSimulationDetails[] = [];
  cardNumberUsedInSimulation: string = '';
  cardNumberInputHTML: HTMLElement;

  private _onLoyaltyOperationAccepted:
    Subject<LoyaltyAttributionInformation> = new Subject();

  constructor(
    private _loyaltyService: LoyaltyService,
    private _keyboardService: KeyboardInternalService,
    private _logHelper: LogHelper
  ) {
  }

  ngOnInit() {
    // this._logHelper.trace('Loyalty panel opened DocumentTotalAmount->');
    // this._logHelper.trace(this.documentTotalAmount);
  }

  ngOnDestroy() {
  }

  ngAfterViewInit() {
    this.cardNumberInputHTML = <HTMLElement>this.cardNumberInput.nativeElement;
    this.cardNumberInputHTML.click();
    this.cardNumberInputHTML.focus();
  }

  onFinish(): Observable<LoyaltyAttributionInformation> {
    return this._onLoyaltyOperationAccepted.asObservable();
  }

  forceFinish(): void {
    this._onLoyaltyOperationAccepted.next(undefined);
  }

  simulateLoyaltyAttribution() {
    this._keyboardService.CloseKeyBoard();
    this.searchingForAttributions = true;
    this.loyaltyAttributionSimulationDetails = [];
    this.errorMessage = '';
    this.simulationDate = new Date();
    this.cardNumberUsedInSimulation = this.loyaltyCardNumber;
    this.cardNumberInputHTML.blur();
    this._loyaltyService.simulateLoyaltyAttribution(this.loyaltyCardNumber,
      this.documentTotalAmount,
      this.documentCurrencyId,
      this.simulationDate,
      undefined).subscribe(
        (response: SimulateLoyaltyAttributionResponse) => {
          this.searchingForAttributions = false;
          if (response.status === SimulateLoyaltyAttributionResponseStatuses.successful) {
            if (response.loyaltyAttributionDetailsList != undefined && response.loyaltyAttributionDetailsList.length == 0) {
              this.errorMessage = 'Selected loyalty card has no attribution data';
            }
            this.loyaltyAttributionSimulationDetails = response.loyaltyAttributionDetailsList;
          } else {
            if (response.status === SimulateLoyaltyAttributionResponseStatuses.invalidCardError) {
              this.errorMessage = 'The card is invalid';
            } else if (response.status === SimulateLoyaltyAttributionResponseStatuses.operationBlockedError) {
              this.errorMessage = 'Operation blocked';
            } else {
              this.errorMessage = 'Cannot simulate loyalty attribution. Check the logs for details.';
            }
            this._logHelper.logError('Loyalty service has respond with an error status->');
            this._logHelper.logError(response);
          }
        },
        err => this._logHelper.logError(err));
  }

  accumulate() {
    const simulationDetails: LoyaltyAttributionSimulationDetails =
      this.loyaltyAttributionSimulationDetails[0];

    this._onLoyaltyOperationAccepted.next({
      benefitId: simulationDetails.benefitId,
      benefitName: simulationDetails.benefitName,
      benefitAmount: simulationDetails.balanceAfter,
      actionType: LoyaltyActionType.accumulation,
      cardNumber: this.cardNumberUsedInSimulation,
      localDateTime: this.simulationDate,
      currencyId: simulationDetails.currencyId,
      documentTotalAmount: this.documentTotalAmount
    });
    // En este punto solamente devolvemos los datos de la posible atribución,  con el tipo de accción seleccionado
    // Por ahora solamente habrá un elemento en la lista
  }

  redeem() {
    const simulationDetails: LoyaltyAttributionSimulationDetails =
      this.loyaltyAttributionSimulationDetails[0];

      if (simulationDetails.balanceAfter >= this.documentTotalAmount) {
        this.errorMessage =
        `Cannot redeem the total available balance (${simulationDetails.balanceAfter}).
         The amount to be redeemed is greater than or equal to the total of the ticket(${this.documentTotalAmount}).
         Try increasing the total amount of the current ticket.`;
      } else {
        this._onLoyaltyOperationAccepted.next({
          benefitId: simulationDetails.benefitId,
          benefitName: simulationDetails.benefitName,
          benefitAmount: simulationDetails.balanceAfter,
          actionType: LoyaltyActionType.redemption,
          cardNumber: this.cardNumberUsedInSimulation,
          localDateTime: this.simulationDate,
          currencyId: simulationDetails.currencyId,
          documentTotalAmount: this.documentTotalAmount
        });
      }
    // En este punto solamente devolvemos los datos de la posible atribución, con el tipo de accción seleccionado
    // Por ahora solamente habrá un elemento en la lista
  }
}
