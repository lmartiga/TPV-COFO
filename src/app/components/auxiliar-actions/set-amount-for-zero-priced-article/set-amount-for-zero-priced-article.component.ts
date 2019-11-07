import { Component, OnInit, OnDestroy } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { Subject } from 'rxjs/Subject';
import { RoundPipe } from 'app/pipes/round.pipe';
import { DocumentLine } from 'app/shared/document/document-line';
import { IActionFinalizable } from 'app/shared/iaction-finalizable';
import { AppDataConfiguration } from 'app/config/app-data.config';
import { LanguageService } from 'app/services/language/language.service';

@Component({
  selector: 'tpv-set-amount-for-zero-priced-article',
  templateUrl: './set-amount-for-zero-priced-article.component.html',
  styleUrls: ['./set-amount-for-zero-priced-article.component.scss']
})
export class SetAmountForZeroPricedArticleComponent implements OnInit, OnDestroy, IActionFinalizable<DocumentLine> {
  private _lineToEdit: DocumentLine;
  private _onLineEdited: Subject<DocumentLine> = new Subject();

  private _numericPattern: string = '^-?[0-9]+([.][0-9]+)?$';

  articlePrice?: number;

  // Literals
  headerLiteral: string;
  enterPriceLiteral: string;
  pricePlaceholderLiteral: string;
  notAValidPriceLiteral: string;
  submitLiteral: string;

  constructor(
    private _roundPipe: RoundPipe,
    private _appDataConfig: AppDataConfiguration,
    private _languageService: LanguageService
  ) {
    this.headerLiteral = this.getLiteral('set_amount_for_zero_priced_article_component', 'header_PriceZeroProduct');
    this.pricePlaceholderLiteral = this.getLiteral('set_amount_for_zero_priced_article_component', 'literal_PriceZeroProduct_Price');
    this.submitLiteral = this.getLiteral('set_amount_for_zero_priced_article_component', 'button_PriceZeroProduct_OK');

    this.notAValidPriceLiteral = this.getLiteral('set_amount_for_zero_priced_article_component', 'validation_PriceZeroProduct_ValueMustBeNumeric');
  }

  ngOnInit() {
    this.enterPriceLiteral = this.getLiteral('set_amount_for_zero_priced_article_component', 'message_PriceZeroProduct_SetPriceForProduct') 
                             + ` ${this._lineToEdit.description}`;
    this.articlePrice = undefined;
  }

  ngOnDestroy() {

  }

  onFinish(): Observable<DocumentLine> {
    return this._onLineEdited.asObservable();
  }

  forceFinish(): void {
    this._onLineEdited.next(undefined);
  }

  get lineToEdit(): DocumentLine {
    return this._lineToEdit;
  }

  set lineToEdit(value: DocumentLine) {
    this._lineToEdit = value;
  }

  sendLine(element: HTMLFormElement) {
    // validate input
    const numberRegexp = new RegExp(this._numericPattern);
    if (numberRegexp.test(this.articlePrice.toString())) {
      // calculate total line amount
      // Se hace dos veces el round porque por alguna razon aveces salia x.xx000000001
      this._lineToEdit.priceWithTax = this.articlePrice;
      this._lineToEdit.totalAmountWithTax = this._roundPipe.transformInBaseCurrency(this._lineToEdit.quantity *
        this._roundPipe.transformInBaseCurrency(this._lineToEdit.priceWithTax * ((100 - this._lineToEdit.discountPercentage) / 100)));      
      const taxAmount = this._roundPipe.transform(this._lineToEdit.priceWithTax -
          (this._lineToEdit.priceWithTax / (1 + (this._lineToEdit.taxPercentage / 100))),
      this._appDataConfig.decimalPrecisionConfiguration.decimalPositionsForUnitPricesWithoutTax);
      this._lineToEdit.priceWithoutTax = this._lineToEdit.priceWithTax - this._roundPipe.transform(taxAmount,
          this._appDataConfig.decimalPrecisionConfiguration.decimalPositionsForUnitPricesWithoutTax);
      this._onLineEdited.next(this._lineToEdit);
    }
  }

  getLiteral(group: string, key: string): string {
    return this._languageService.getLiteral(group, key);
  }
}
