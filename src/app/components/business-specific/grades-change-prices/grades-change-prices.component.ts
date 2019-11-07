import { Component, OnInit, OnDestroy, HostBinding } from '@angular/core';
import { IActionFinalizable } from 'app/shared/iaction-finalizable';
import { GradesChangePricesService } from 'app/services/grades-change-price/grades-change-prices.service';
import { GradePrice } from 'app/shared/fuelling-point/grade-price';
import { Subject } from 'rxjs/Subject';
import { LanguageService } from 'app/services/language/language.service';
import { AppDataConfiguration } from 'app/config/app-data.config';
import { Observable } from 'rxjs/Observable';
import { FuellingPointFormatConfiguration } from 'app/shared/fuelling-point/fuelling-point-format-configuration';
import { StatusBarService } from 'app/services/status-bar/status-bar.service';
import { FormatHelper } from 'app/helpers/format-helper';
import { Subscription } from 'rxjs/Subscription';
import { FuellingPointsInternalService } from 'app/services/fuelling-points/fuelling-points-internal.service';
import { FuellingPointInfo } from 'app/shared/fuelling-point/fuelling-point-info';

@Component({
  selector: 'tpv-grades-change-prices',
  templateUrl: './grades-change-prices.component.html',
  styleUrls: ['./grades-change-prices.component.scss']
})
export class GradesChangePricesComponent implements OnInit, IActionFinalizable<boolean>, OnDestroy {
  @HostBinding('class') class = 'tpv-grades-change-prices';

  observations: string;
  // En este array me guardo la informacion de un grade price mas un campo que sera el nuevo precio para mmostrar en la ui
  gradePriceListAmplified:
      Array<{gradeId: number, gradeName: string, price: number, newPrice: number,gradeReference:string}> = [];
  newPriceValidationErrorMessage: string;
  isDeferred: boolean = false;
  dateDeferred: Date;
  hourDeferred: String;
  minDateDeferred: Date;

  private _gradePriceList: GradePrice[];
  private _gradesPricesChanged: Subject<boolean> = new Subject();
  private _showSpinner: boolean = true;
  formatConfig: FuellingPointFormatConfiguration;
  private _subscriptions: Subscription[] = [];
  fpInformation: Array<FuellingPointInfo>;

  constructor(
    private _gradesChangePricesService: GradesChangePricesService,
    private _appDataConfig: AppDataConfiguration,
    private _languageService: LanguageService,
    private _statusBar: StatusBarService,
    private _internalSvc: FuellingPointsInternalService,
  ) {
    window.addEventListener('resize', () => this._setMixtHeight());
  }

  ngOnInit() {
    this.minDateDeferred = new Date();
    this._showSpinner = true;
    this._subscriptions.push(this._gradesChangePricesService.getGradePrices().first().subscribe((gradePrices: GradePrice[]) => {
      if (gradePrices != undefined && gradePrices.length > 0) {
        this._gradePriceList = gradePrices;
        this.gradePriceListAmplified = this._gradePriceList.map((gradePrice: GradePrice) => {
          const gradePriceAmplified = {
            gradeId: gradePrice.gradeId,
            gradeName: gradePrice.gradeName,
            price: gradePrice.price,
            newPrice:  gradePrice.price,
            gradeReference: gradePrice.gradeReference
          };
          return gradePriceAmplified;
        });

      } else {
        this._gradePriceList = [];
      }
      this._showSpinner = false;
      this._setMixtHeight();
    }));

    // this._subscriptions.push(this._internalSvc.getOnAllFuellingPointsFromComponent()
    // .subscribe(data => {
    //   this.fpInformation = data;
    // }));

    this.newPriceValidationErrorMessage = this.getLiteral('grades_change_prices_component', 'decimals_error') +
      this._appDataConfig.decimalPrecisionConfiguration.decimalPositionsForUnitPricesWithTaxForTrackProduct;
  }

  ngOnDestroy(): void {
    this._subscriptions.forEach(s => s.unsubscribe());
  }

  onFinish(): Observable<boolean> {
    return this._gradesPricesChanged.asObservable();
  }
  forceFinish(): void {
    this._gradesPricesChanged.next(false);
  }

  showSpinner(): boolean {
    return this._showSpinner;
  }

  getLiteral(group: string, key: string): string {
    return this._languageService.getLiteral(group, key);
  }

  onSubmit() {
    if (this.isChangeButtonAvaible() === true && this.isAnyPriceChanged() === true) {
      if (this.isDeferredValidate()) {
        this._showSpinner = true;
        const newGradePriceList: Array<GradePrice> = this.gradePriceListAmplified.filter(gradefilter =>
          { return gradefilter.newPrice != gradefilter.price }
          ).map(gradePriceAmplified => {
            const newGradePrice = {
              gradeId: gradePriceAmplified.gradeId,
              gradeName: gradePriceAmplified.gradeName,
              price: gradePriceAmplified.newPrice,
              gradeReference : gradePriceAmplified.gradeReference,
              pricePrevious : gradePriceAmplified.price,
           }
            return newGradePrice;
        });
        this._subscriptions.push(this._gradesChangePricesService.changeGradePrices(newGradePriceList, this.observations, this.shopId() ,this.isDeferred, this.getDatetimeDeferred()).first().subscribe((response: boolean) => {
            this._showSpinner = false;
            if (response === true) {
              this._gradesPricesChanged.next(true);
              if (this.isDeferred) {
                this._statusBar.publishMessage('Se envió las modificaciones del cambio de precio en  diferido.');
              } else {
                this.updateFuellingPoint(newGradePriceList);
                this._statusBar.publishMessage('Cambio de precios inmediato, realizado correctamente.');
              }
            }
          }));
      }
    }
  }

  isChangeButtonAvaible(): boolean {
    if (this._showSpinner === false && this.isAnyPriceChanged() === true) {
      return true;
    }
    return false;
  }

  isAnyPriceChanged(): boolean {
    if (this.gradePriceListAmplified.find(gradePriceAmplified =>
      gradePriceAmplified.newPrice != undefined && gradePriceAmplified.newPrice != gradePriceAmplified.price) != undefined) {
        return true;
      }

    return false;
  }

  newPricePattern(): string {
    let result: string = '^[0-9]+$';
    if (this._appDataConfig.decimalPrecisionConfiguration.decimalPositionsForUnitPricesWithTaxForTrackProduct > 0) {
        result = '^[0-9]+([.]' +
          this._patternDecimalsAuxiliar(this._appDataConfig.decimalPrecisionConfiguration.decimalPositionsForUnitPricesWithTaxForTrackProduct)
          + ')?$';
    }
    return result;
  }

  hasAnyGradePriceListAmplified(): boolean {
    if (this.gradePriceListAmplified != undefined && this.gradePriceListAmplified.length > 0) {
      return true;
    }
    return false;
  }

  private _patternDecimalsAuxiliar(decimals: number): string {
    let decimalsPattern: string = '';
    for (let i = 0; i < decimals; i++) {
      decimalsPattern += '[0-9]?';
    }
    return decimalsPattern;
  }

  private _setMixtHeight() {
    setTimeout(() => {
      this.calcularHeightOverFlow();
    }, 250);
  }

  private calcularHeightOverFlow(){
    const calcBtnBottomHeight = Number(jQuery('.tpv-grades-change-prices .button-bottom').css('height').replace('px', ''));
    const calcTitleHeight = Number(jQuery('.tpv-grades-change-prices .auxiliar-action-title').css('height').replace('px', ''));
    const calcHeight = jQuery('.tpv-slide-over').height() -
      ( calcTitleHeight + calcBtnBottomHeight  +
        jQuery('.tpv-grades-change-prices .tpv-mixt-payment-amount').height());
    jQuery('.tpv-grades-change-prices .divOverflow').css('height', calcHeight);
  }

  inputHourDeferredChangeHandler(event: any) {
    this.hourDeferred = event.target.value;
  }

  showDeferred(): boolean {
    return this.isDeferred;
  }

  isDeferredValidate(): boolean {
    if (this.isDeferred === true) {
        if (this.dateDeferred) {
            if (this.hourDeferred) {
                return true;
            } else {
              this._statusBar.publishMessage(this.getLiteral('grades_change_prices_component', 'deferred_time'));
              return false;
            }
        } else {
          this._statusBar.publishMessage(this.getLiteral('grades_change_prices_component', 'deferred_date'));
          return false;
        }
    } else {
      return true;
    }
  }

  getDatetimeDeferred(): any {
    if (this.isDeferred) {
      this.dateDeferred.setHours(+this.hourDeferred.substring(0, 2), +this.hourDeferred.substring(3, 5), 0, 0);
      return FormatHelper.dateToISOString(this.dateDeferred);
    }
    return undefined;
  }

  shopId(): string {
    const shop = this._appDataConfig.shop;
    return shop == undefined || shop.id == undefined || shop.id.trim() == '' ? '' : shop.id;
  }

  fnClickCheckDeferred() {
      this.dateDeferred = undefined;
      this.hourDeferred = undefined;
  }

  updateFuellingPoint( newGradePriceList: Array<GradePrice> ) {
   this.fpInformation =  this._internalSvc.fpListInternal;
   this.fpInformation.forEach(fp => {
    fp.availableGradeList.forEach(grade => {
        grade.unitaryPrice = (newGradePriceList.find(x => x.gradeId === grade.id)) ?
        newGradePriceList.find(x => x.gradeId === grade.id).price : grade.unitaryPrice;
    });
   });
   this._internalSvc.updateAllFuellingPointsFromComponent(this.fpInformation);
  }

}
