import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { RoundPipe } from 'app/pipes/round.pipe';
import { DocumentLine } from 'app/shared/document/document-line';
import { Subject } from 'rxjs/Subject';
import { Observable } from 'rxjs/Observable';
import { Subscriber } from 'rxjs/Subscriber';
import { IActionFinalizable } from 'app/shared/iaction-finalizable';
import { AuthorizationInternalService } from 'app/services/authorization/authorization-internal.service';
import { AuthorizationPermissionType } from 'app/shared/authorization/authorization-permission-type.enum';
import { OperatorInternalService } from 'app/services/operator/operator-internal.service';
import { AppDataConfiguration } from 'app/config/app-data.config';
import { GenericHelper } from 'app/helpers/generic-helper';
import { NgModel } from '@angular/forms';
import { StatusBarService } from 'app/services/status-bar/status-bar.service';
import { ChangePaymentInternalService } from 'app/services/payments/change-payment-internal.service';
import { keyboardstatic } from 'app/shared/Keyboard/keyboard-static';
import { Subscription } from 'rxjs/Subscription';
import { LanguageService } from 'app/services/language/language.service';
import { LogHelper } from 'app/helpers/log-helper';

@Component({
  selector: 'tpv-edit-document-line',
  templateUrl: './edit-document-line.component.html',
  styleUrls: ['./edit-document-line.component.scss']
})
export class EditDocumentLineComponent implements OnInit, OnDestroy, AfterViewInit, IActionFinalizable<DocumentLine> {

  @ViewChild('editLineForm') editLineFormNgModel: NgModel;
  @ViewChild('quantityElemRef') quantityElementRef: ElementRef;
  @ViewChild('discountPercentageElemRef') discountPercentageElementRef: ElementRef;
  @ViewChild('priceWithTaxElemRef') priceWithTaxElementRef: ElementRef;
  private _originalLineToEdit: DocumentLine;
  private _onLineEdited: Subject<DocumentLine> = new Subject();
  private _availableTabNames: string[] = []; //['Cantidad', 'Precio', 'Descuento'];
  private _quantityHTMLElement: HTMLElement;
  private _priceWithTaxHTMLElement: HTMLElement;
  private _discountPrecentageHTMLElement: HTMLElement;
  private _subscriptions: Subscription[] = [];
  
  _lineToEdit: DocumentLine;
  textQuantity: string;
  textAmount: string;
  textDiscount: string;
  textFieldValidationErrorMessage: string = ''; //'Se debe introducir un valor y este ha de ser numérico';
  discountPercentageValidationErrorMessage: string = ''; //'Se debe de introducir un valor entre 0 y 100';
  textFieldValidationNumericMessage: string = ''; //'Debe introducir una cantidad numerica distinta de 0';
  numberPattern: string = '^[0-9]+([.][0-9]+)?$';
  notAllowedMessage: string = '';
  selectedTab: number = 0;
  selectedTabName: string = this._availableTabNames[this.selectedTab];
  tipoArticulo: string;

  constructor(
    private _roundPipe: RoundPipe,
    private _auth: AuthorizationInternalService,
    private _operatorInternalSvc: OperatorInternalService,
    private _appDataConfig: AppDataConfiguration,
    private _statusBarService: StatusBarService,
    private _ChangePaymentInternal: ChangePaymentInternalService,
    private _languageService: LanguageService,
    private  _logHelper: LogHelper
  ) {
    this.textFieldValidationErrorMessage = this.getLiteral('edit_document_line_component', 'validation_EditLine_ValueRequiredAndNumeric');
    this.discountPercentageValidationErrorMessage = this.getLiteral('edit_document_line_component', 'validation_EditLine_DiscountBetween0And100');
    this.textFieldValidationNumericMessage = this.getLiteral('edit_document_line_component', 'validation_EditLine_ValueRequiredDistintOf0');
    this._availableTabNames = 
                [this.getLiteral('edit_document_line_component', 'tab_EditLine_Quantity'),
                 this.getLiteral('edit_document_line_component', 'tab_EditLine_Price'),
                 this.getLiteral('edit_document_line_component', 'tab_EditLine_Discount')];
  }

  ngOnInit() {
    this.textQuantity = this._availableTabNames[0];
    this.textAmount = this._availableTabNames[1];
    this.textDiscount = this._availableTabNames[2];
    this._quantityHTMLElement = (this.quantityElementRef.nativeElement as HTMLElement);
    this._priceWithTaxHTMLElement = (this.priceWithTaxElementRef.nativeElement as HTMLElement);
    this._discountPrecentageHTMLElement = (this.discountPercentageElementRef.nativeElement as HTMLElement);

    this._subscriptions.push(this._ChangePaymentInternal.KeyboardStaticResponse$.subscribe(d => {
      if(d.intro == 'enter'){
        this.sendLine();
      }
      if(d.value != undefined){
        var tipo =  d.value.split('-');
        if(tipo[0] == 'quantity'){
          var valor = this._lineToEdit.typeArticle.substring(5, this._lineToEdit.typeArticle.length)
          const valores = this._appDataConfig.getConfigurationParameterByName('VALIDATE_QUANTITY_NUMBER', 'GENERAL');
          this.tipoArticulo = valores.meaningfulStringValue;
          if( this.tipoArticulo.indexOf(valor) != -1){            
            if(tipo[1].indexOf('.') != -1){
              tipo[1] =  tipo[1].replace(".", "");    
              this._quantityHTMLElement.focus();
              this.lineToEdit.quantity = Number(tipo[1]);
              const RequestKeyboard: keyboardstatic= {
                tipo: 1,
                value: this._quantityHTMLElement,
                intro: undefined
              }
              this._ChangePaymentInternal.fnkeyboard(RequestKeyboard)
            }else{
              this._quantityHTMLElement.focus();
              this.lineToEdit.quantity = Number(tipo[1]);
            }
          }else{
            this._quantityHTMLElement.focus();
            this.lineToEdit.quantity =Number(tipo[1]);
          }
          
          
        }
        if(tipo[0] == 'priceWithTax'){
          this._priceWithTaxHTMLElement.focus();
          this.lineToEdit.priceWithTax = tipo[1];
        }
        if(tipo[0] == 'discountPercentage'){
          this._discountPrecentageHTMLElement.focus();
          this.lineToEdit.discountPercentage = tipo[1];
        }      
      }
    }));




  }

  ngAfterViewInit() {
    setTimeout(() => {
      this.changeInpputFocus();   
    });
  }

  ngOnDestroy() {
    /*
    jQuery('.selecArticulo').css('font-family', '');
    jQuery('.selecArticulo').css('font-weight', 'normal');
    jQuery('.selecArticulo').css('background-color', '#ffffff');
    jQuery('.buttonCancel').css('background-image', 'linear-gradient(104deg, #aca39a 78%, #ffffff 0%)');
    */
    this._subscriptions.forEach(p => p.unsubscribe());
  }


  onFinish(): Observable<DocumentLine> {
    return this._onLineEdited.asObservable();
  }

  forceFinish(): void {
    jQuery('.selecArticulo').css('font-family', '');
    jQuery('.selecArticulo').css('font-weight', 'normal');
    jQuery('.selecArticulo').css('background-color', '#ffffff');
    jQuery('.buttonCancel').css('background-image', 'linear-gradient(104deg, #aca39a 78%, #ffffff 0%)');
    this.resetData('');
    this._onLineEdited.next(undefined);
  }

  get lineToEdit(): DocumentLine {
    this._lineToEdit.quantity = +this._lineToEdit.quantity;
    return this._lineToEdit;
  }

  set lineToEdit(lineToEdit: DocumentLine) {
    this._lineToEdit = lineToEdit;
    this._originalLineToEdit = GenericHelper.deepCopy(lineToEdit);
  }

  changeInpputFocus() {
    if (this.selectedTab === 0 && this._quantityHTMLElement) {
      this._quantityHTMLElement.click();
      this._quantityHTMLElement.focus();
      this.resetData('');
    } else if (this.selectedTab === 1 && this._priceWithTaxHTMLElement) {
      this._priceWithTaxHTMLElement.click();
      this._priceWithTaxHTMLElement.focus();
      this.resetData('');
    } else if (this.selectedTab === 2 && this._discountPrecentageHTMLElement) {
      this._discountPrecentageHTMLElement.click();
      this._discountPrecentageHTMLElement.focus();
      this.resetData('');
    }
    this.selectedTabName = this._availableTabNames[this.selectedTab];
  }

  sendLine() {    
    if (this._lineToEdit.coste != this._lineToEdit.priceWithTax &&
      this._lineToEdit.coste > this._lineToEdit.priceWithTax &&
      jQuery('#price').prop("disabled") != true) {
      this._statusBarService.publishMessage(this.getLiteral('edit_document_line_component', 'message_EditLine_ModifyPriceBelowCostPrice'));
    }
    else {
      this._statusBarService.publishMessage('');
      if (this.lineToEdit != undefined && !this.editLineFormNgModel.invalid) {
        let allowed: Observable<boolean> = Observable.create((observer: Subscriber<boolean>) => observer.next(true));
        if (this.selectedTab == 1) {
          allowed = this._auth.validateOperatorPermission(this._operatorInternalSvc.currentOperator, AuthorizationPermissionType.allowPriceChange);
        } else if (this.selectedTab == 2) {
          allowed = this._auth.validateOperatorPermission(this._operatorInternalSvc.currentOperator, AuthorizationPermissionType.allowLineDiscount);
        }

        allowed.subscribe((response: boolean) => {
          if (response === true) {
            // validation
            const numberRegexp = new RegExp(this.numberPattern);
            if (numberRegexp.test(this.lineToEdit.quantity.toString()) &&
              numberRegexp.test(this.lineToEdit.priceWithTax.toString()) &&
              numberRegexp.test(this.lineToEdit.discountPercentage.toString())) {
              // calculate total line amount
              // Se hace dos veces el round porque por alguna razon aveces salia x.xx000000001
              this.lineToEdit.totalAmountWithTax = this._roundPipe.transformInBaseCurrency(this.lineToEdit.quantity *
                this._roundPipe.transformInBaseCurrency(this.lineToEdit.priceWithTax * ((100 - this.lineToEdit.discountPercentage) / 100)));
              const taxAmount = this._roundPipe.transform(this.lineToEdit.priceWithTax -
                (this.lineToEdit.priceWithTax / (1 + (this.lineToEdit.taxPercentage / 100))),
                this._appDataConfig.decimalPrecisionConfiguration.decimalPositionsForUnitPricesWithoutTax);
              this.lineToEdit.priceWithoutTax = this.lineToEdit.priceWithTax - this._roundPipe.transform(taxAmount,
                this._appDataConfig.decimalPrecisionConfiguration.decimalPositionsForUnitPricesWithoutTax);                            
            }
            this._logHelper.trace("precio total", this.lineToEdit.totalAmountWithTax)
          } else {
            this.resetData(this._languageService.getLiteral('edit_document_line_component', 'error_EditLine_OperatorHasNotPermission'));
          }
        });
        if (this.lineToEdit.quantity <= 0) {
          this._statusBarService.publishMessage(this.textFieldValidationNumericMessage);
        } else if (this._lineToEdit.coste > this.lineToEdit.totalAmountWithTax && jQuery('#price').prop("disabled") != true){          
          this._statusBarService.publishMessage(this.getLiteral('edit_document_line_component','message_EditLine_ModifyPriceBelowCostPrice'));
        } else {
          this._onLineEdited.next(this._lineToEdit);
        }
      }
    }
  }

  resetData(notAllowedMessage: string): void {
    this.notAllowedMessage = notAllowedMessage;
    this.selectedTabName = this._availableTabNames[this.selectedTab];
    this.lineToEdit.quantity = this._originalLineToEdit.quantity;
    this.lineToEdit.priceWithTax = this._originalLineToEdit.priceWithTax;
    this.lineToEdit.discountPercentage = this._originalLineToEdit.discountPercentage;
  }
  ObtenerValor(val: HTMLElement){
    const RequestKeyboard: keyboardstatic= {
      tipo: 1,
      value: val,
      intro: undefined
    }
    this._ChangePaymentInternal.fnkeyboard(RequestKeyboard)
  }

  getLiteral(group: string, key: string): string {
    return this._languageService.getLiteral(group, key);
  }
}
