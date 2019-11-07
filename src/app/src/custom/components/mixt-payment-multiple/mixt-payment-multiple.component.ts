import { Customer } from './../../../../shared/customer/customer';
import { OnInit, OnDestroy, AfterViewInit, Component, HostBinding, ViewChild, ElementRef } from '@angular/core';
import { IActionFinalizable } from 'app/shared/iaction-finalizable';
import { AppDataConfiguration } from 'app/config/app-data.config';
import { LanguageService } from 'app/services/language/language.service';
import { PaymentPurpose } from 'app/shared/payments/PaymentPurpose.enum';
import { Subject } from 'rxjs/Subject';
import { Subscriber } from 'rxjs/Subscriber';
import { Document } from 'app/shared/document/document';
import { Observable } from 'rxjs/Observable';
import { RoundPipe } from 'app/pipes/round.pipe';
import { PaymentMethod } from 'app/shared/payments/payment-method';
import { PaymentMethodType } from 'app/shared/payments/payment-method-type.enum';
import { StatusBarService } from 'app/services/status-bar/status-bar.service';
import { CurrencyPriorityType } from 'app/shared/currency/currency-priority-type.enum';
import { Currency } from 'app/shared/currency/currency';
import { PaymentDetail } from 'app/shared/payments/payment-detail';
import { CustomerInternalService } from 'app/services/customer/customer-internal.service';
import { SearchDocument } from 'app/shared/web-api-responses/search-document';
import { DocumentGroup } from '../../models/DocumentGroup';
import { DocumentLine } from 'app/shared/document/document-line';
import { MixtPaymentService } from 'app/services/payments/mixt-payment.service';
import { OperatorInternalService } from 'app/services/operator/operator-internal.service';
import { DocumentSearchInternalService } from 'app/services/document/document-search-internal.service';
import { SearchDocumentMode } from 'app/shared/document-search/search-document-mode.enum';
import { GetDocumentResponseStatuses } from 'app/shared/web-api-responses/get-document-response-statuses.enum';

enum CollectionButtonVisibilty {
  collection = 0,
  invoice = 1,
  both = 2
}
@Component({
  selector: 'tpv-mixt-payment-multi',
  templateUrl: './mixt-payment-multiple.component.html',
  styleUrls: ['./mixt-payment-multiple.component.scss']
})
export class MixtPaymentMultipleComponent implements OnInit, OnDestroy, IActionFinalizable<boolean>, AfterViewInit {
  @HostBinding('class') class = 'tpv-mixt-payment-multi';
  // para poner el foco en el input
  @ViewChild('inputPayment') inputPayment: ElementRef;

  private allowPending: boolean;
  private _onMixtPayment: Subject<boolean> = new Subject();
  private _paymentPurpose: PaymentPurpose;
  // private _listDocuments: SearchDocument[] = [];
  _currentDocument: Document;
  pendiente: number;
  selectedIndex: number;
  inputNumber: string;
  paymentMethodList: Array<PaymentMethod>;
  currencySelected: Currency;
  secondaryCurrency: Currency;
  inputNumberInBaseCurrency: number;
  listOfPayments: Array<PaymentDetail> = [];
  changeDelivered: number;
  showActions: boolean;
  SubTotalDeudas: number;
  titulo: string;
  collectionButtonVisibility: CollectionButtonVisibilty = 2;
  documentGroup: DocumentGroup = new DocumentGroup();
  private _requestingSendSale: boolean = false;
  MsgValidateDebt: boolean = false;
  MsgValidateDebtTex: string = '';
  baseCurrency: Currency;
  paymentMethodTypeWithSecondaryCurrency: PaymentMethodType;
  isUnknownCustomer: boolean = false;
  changeFactorFromSecondary: number;
  listIdDocuemnts: Array<string> = [];

  constructor(
    private _appDataConfig: AppDataConfiguration,
    private _mixtPaymentService: MixtPaymentService,
    private _roundPipe: RoundPipe,
    private _statusBarService: StatusBarService,
    private _customerInternalService: CustomerInternalService,
    private _operatorSvc: OperatorInternalService,
    private _languageService: LanguageService,
    private _documentSearchInternal: DocumentSearchInternalService
  ) {
    window.addEventListener('resize', () => this._setMixtHeight());
    this.allowPending = _appDataConfig.allowPendingPayment;
  }

  /**
   * Inicializa los valores para este componente
   * @param document contiene la informacion del pago
   * @param paymentPurpose indica el proposito del pago
   * @param invoiceMandatory indica si es obligatorio la emision de factura
   */
  setDocumentsAndPaymentPurposeMassive(listDocuments: SearchDocument[], paymentPurpose: PaymentPurpose, cliente: Customer) {
    this._paymentPurpose = paymentPurpose;
    this.documentGroup.cliente = cliente;
    this.documentGroup.operator = this._operatorSvc.currentOperator.name;

    listDocuments.forEach((x, i) => {
      this.documentGroup.documentIdList.push({
        id: x.documentNumber, totalAmountWithTax: x.totalAmountWithTax,
        pendingAmountWithTax: x.pendingAmountWithTax, paymentDetailList: []
      });
      this.documentGroup.totalAmountWithTax += x.totalAmountWithTax;
      this.documentGroup.pendingAmountWithTax += x.pendingAmountWithTax;

      const idDocCompleto: string = this._appDataConfig.company.id + x.documentNumber;
      this.listIdDocuemnts.push(idDocCompleto);
    });

    // Incluimos los suministros en las deudas masivas.
    /*
    this.IncluirSumiDeudasMasivas(this.documentGroup, idDocCompleto)
      .subscribe(response => {
        if (response) {

          if (i === listDocuments.length - 1) {
            this._initialize();
          }

        }
      });*/
    this.IncluirSumDeudasMasivas(this.documentGroup, this.listIdDocuemnts)
      .subscribe(response => {
        if (response) {
          this._initialize();
        }
      });
  }


  IncluirSumiDeudasMasivas(grupoDocumento: DocumentGroup, idDocumento: string): Observable<boolean> {
    return Observable.create((observer: Subscriber<boolean>) => {

      this._documentSearchInternal.getDocument(idDocumento, SearchDocumentMode.Pending)
        .first().subscribe(response => {
          if (response != undefined && response.status == GetDocumentResponseStatuses.Successful) {

            response.document.lines.forEach(linea => {
              grupoDocumento.documentIdList.forEach(docGru => {

                if ((this._appDataConfig.company.id + docGru.id) == response.document.documentId) {
                  if (docGru.supplyTransactionList == undefined) {
                    docGru.supplyTransactionList = [];
                  }

                  let pos: number;
                  pos = linea.description.indexOf(' ', 3);

                  // Añadimos la descripción correcta a nuestro supply.
                  linea.businessSpecificLineInfo.supplyTransaction.description = linea.description.substring(pos + 1);

                  docGru.supplyTransactionList.push(linea.businessSpecificLineInfo.supplyTransaction);
                }

              });
            });

            observer.next(true);
          }
          else {
            this._statusBarService.publishMessage(this.getLiteral('mixt_payment_component', 'message_MixtPayment_errorOccurredRecoveringData'));
            observer.next(false);
          }
        });

    });
  }


  IncluirSumDeudasMasivas(grupoDocumento: DocumentGroup, idDocumentos: string[]): Observable<boolean> {
    return Observable.create((observer: Subscriber<boolean>) => {
      this._documentSearchInternal.getDocumentMassive(idDocumentos, SearchDocumentMode.Pending)
        .first().subscribe(response => {
          if (response != undefined && response.status == GetDocumentResponseStatuses.Successful) {
            response.documents.forEach(objdocumento => {
              objdocumento.lines.forEach(linea => {
                grupoDocumento.documentIdList.forEach(docGru => {

                  if ((this._appDataConfig.company.id + docGru.id) == objdocumento.documentId) {
                    if (docGru.supplyTransactionList == undefined) {
                      docGru.supplyTransactionList = [];
                    }
                    let pos: number;
                    pos = linea.description.indexOf(' ', 3);

                    // Añadimos la descripción correcta a nuestro supply.
                    if (linea.businessSpecificLineInfo.supplyTransaction != undefined) {
                      linea.businessSpecificLineInfo.supplyTransaction.description = linea.description.substring(pos + 1);
                      docGru.supplyTransactionList.push(linea.businessSpecificLineInfo.supplyTransaction);
                    }

                  }

                });
              });
            });
            observer.next(true);
          }
          else {
            this._statusBarService.publishMessage(this.getLiteral('mixt_payment_component', 'message_MixtPayment_errorOccurredRecoveringData'));
            observer.next(false);
          }
        });
    });
  }

  // inicializa los métodos de pago y otros datos (pendiente, si hay cliente contado...)
  // se añade método de pago que tenga divisa secundaria a parte de la base
  private _initialize() {
    this.showActions = false;

    // lista de los métodos de pago teniendo en cuenta las divisas
    if (this._appDataConfig.paymentMethodList != undefined) {
      this.paymentMethodList = this._appDataConfig.paymentMethodList.filter(p => p.type !== PaymentMethodType.runaway);
    }

    // CAMBIO DE FUNCIONALIDAD, AHORA HAY QUE OCULTAR LOS MEDIOS DE PAGO QUE NO SON "PARATPV"
    this.paymentMethodList = this.paymentMethodList.filter(p => p.paraTPV);

    // datos constantes
    switch (this._paymentPurpose) {
      case PaymentPurpose.PendingPayment:
        this.titulo = this.getLiteral('mixt_payment_component', 'header_MixPayment_PendingPayment'); // 'PAGO PENDIENTE';
        this.pendiente = parseFloat(this.documentGroup.pendingAmountWithTax.toFixed(2));
        this.collectionButtonVisibility = CollectionButtonVisibilty.collection;
        this.paymentMethodList = this.paymentMethodList.filter(p => p.id !== this._appDataConfig.company.id + '70');

        // Ocultamos los medios de pagos que no son integrados con el TME
        // Tarjeta, waylet, credito local
        this.paymentMethodList = this.paymentMethodList.filter(p => p.id !== this._appDataConfig.company.id + '10');
        this.paymentMethodList = this.paymentMethodList.filter(p => p.id !== this._appDataConfig.company.id + '13');
        this.paymentMethodList = this.paymentMethodList.filter(p => p.id !== this._appDataConfig.company.id + '14');
        break;
      default:
    }

    this.listOfPayments = [];

    this.changeDelivered = 0;
    this.inputNumber = '0';
    // divisas
    this.currencySelected = this.baseCurrency = this._appDataConfig.baseCurrency;
    this.secondaryCurrency = this._appDataConfig.secondaryCurrency;
    this.paymentMethodTypeWithSecondaryCurrency = PaymentMethodType.cash;
    // pendiente y saber si el cliente es contado o no
    if (this.documentGroup !== undefined) {
      this.isUnknownCustomer = this.documentGroup.cliente == undefined ?
        true
        : this._customerInternalService.isUnknownCustomer(this.documentGroup.cliente.id);
    }
    // pagos con segunda divisa
    this._addTypeCurrencyPaymentMethod();
    if (this.secondaryCurrency) {
      this._addPaymentMethodSecondaryCurrency(this.paymentMethodTypeWithSecondaryCurrency);
    }
    this._setDefaultSelectedPaymentMethod();
    this.collectionButtonVisibility = 3;
  }

  // se especifica el tipo de divisa para cada método de pago
  // si en lista divisas hay segunda divisa, se añade a los tipos de pago
  private _addTypeCurrencyPaymentMethod() {
    this.paymentMethodList.forEach(paymentMethod => {
      paymentMethod.currencyType = CurrencyPriorityType.base;
    });
    if (this.secondaryCurrency) {
      this.changeFactorFromSecondary = this._roundPipe.transformInBaseCurrency(1 / this.secondaryCurrency.changeFactorFromBase);
    }
  }

  // duplica el método de pago, uno con la divisa base y otro con la secundaria
  // NOTA: la segunda divisa de momento solo para el pago en efectivo
  private _addPaymentMethodSecondaryCurrency(paymentMethodTypeWithSecondaryCurrency: PaymentMethodType) {
    const paymentMethod: PaymentMethod = this._appDataConfig.getPaymentMethodByType(paymentMethodTypeWithSecondaryCurrency);
    const paymentMethodSecondary: PaymentMethod = Object.assign({}, paymentMethod);
    if (paymentMethodSecondary && this.paymentMethodList != undefined) {
      // tipo de divisa
      paymentMethodSecondary.currencyType = this.secondaryCurrency.priorityType;
      paymentMethod.currencyType = this._appDataConfig.baseCurrency.priorityType;
      // cambiamos la descripción para que se vea en UI el símbolo divisa
      paymentMethodSecondary.panelDescription = this.secondaryCurrency.symbol;
      paymentMethod.panelDescription = this.baseCurrency.symbol;
      // se elimina el tipo de pago original y se añaden los dos (con divisa base y con secundaria)
      this.paymentMethodList = this.paymentMethodList.filter(p => p.id !== paymentMethod.id);
      this.paymentMethodList.unshift(paymentMethodSecondary);
      this.paymentMethodList.unshift(paymentMethod);
    }
  }

  ngOnInit() {
  }

  ngOnDestroy() {
  }

  ngAfterViewInit(): void {
    this._setMixtHeight();
    // NOTA: hack timeout para ejecutar funciones estando ya renderizado el HTML
    setTimeout(() => {
      this.setInputFocus();
    }, 0);
    // al inicializarse la vista hago click en el input para que aparezca el teclado
    this.triggleClickEventOnInput();
  }

  onFinish(): Observable<boolean> {
    return this._onMixtPayment.asObservable();
  }

  forceFinish(): void {
    this._onMixtPayment.next(undefined);
  }

  setInputNumber(numero: string): void {
    const str: string = this.inputNumber.toString() + numero;
    this.inputNumber = str;
  }

  // al clicar en un método de pago le sugiere la cantidad exacta que falta por pagar
  payment(index: number) {
    if (this.pendiente > 0 && this._paymentPurpose !== PaymentPurpose.Refund) {
      this.selectedIndex = index;
      this.inputNumber = this._roundPipe.transformInBaseCurrency(this.pendiente).toString();
      if (this.paymentMethodList && this.paymentMethodList[index] &&
        // CAMBIAR CODIGO MEDIO DE PAGO POR CONSTANTE
        this.paymentMethodList[index].id.substring(5) == PaymentMethodType.localcredit.toString()) {
        if (this.pendiente == this.documentGroup.totalAmountWithTax) {
          // Comprobar si el cliente tiene el credito activado y saldo suficiente, si no lo tiene no ejecutar this.setPayment();
          this.setPayment();
        } else {
          this._statusBarService.publishMessage(this.getLiteral('mixt_payment_component', 'message_MixPayment_MeansPayLocalNotMixed'));
          // Quitamos La Selección de Credito local y ponemos el valor por defecto
          this.selectedIndex = 0;
        }
      } else
        // si es segunda divisa se calcula la cantidad a sugerir en dicha divisa
        if (this.paymentMethodList && this.paymentMethodList[index] &&
          this.paymentMethodList[index].currencyType == CurrencyPriorityType.secondary) {
          this.currencySelected = this._appDataConfig.getCurrencyByType(this.paymentMethodList[index].currencyType);
          this.inputNumber = this.inputNumberToSecundaryCurrencySupplyingPending((Number)(this.inputNumber)).toString();
          this.setInfoAboutPaymentSecondaryCurrency();
        }
      // NOTA: hack timeout para ejecutar funciones estando ya cambiado el HTML
      setTimeout(() => {
        this.setInputFocus();
      });
    }
  }

  // Se inserta un pago con un método de pago. Si es correcto se actualizan las cuantías pendientes y el cambio
  // Si ya se introdujo una cantidad de un método de pago, se suma a dicho método en la tabla
  // Si es a un nuevo método de pago se crea una nueva fila para dicho método
  private _insertPayment(metodo: PaymentMethod, givenInputAmount: number, pendiente: number) {
    givenInputAmount = parseFloat(givenInputAmount.toFixed(2));
    let secondaryGivenAmount, secondaryTakenAmount;
    if (metodo.currencyType === undefined) {
      metodo.currencyType = CurrencyPriorityType.base;
    }
    const currencyPaymentMethod = this._appDataConfig.getCurrencyByType(metodo.currencyType);
    // si metodo es con segunda moneda se guarda en SECONDARYAMOUNT y los datos se convierten a divisa base
    if (metodo.currencyType == CurrencyPriorityType.secondary) {
      secondaryGivenAmount = givenInputAmount;
      const pendingPayment = this._roundPipe.transformInBaseCurrency(this.pendiente);
      const inputPaymentToSupplyPending = this.inputNumberToSecundaryCurrencySupplyingPending(pendingPayment);
      secondaryTakenAmount = this._getTakenAmount(givenInputAmount, inputPaymentToSupplyPending);
      givenInputAmount = this._convertSecondaryToBase(givenInputAmount);
      // la cantidad insertada se vuelve a pasar a base para el resto de calculos
      this.inputNumber = givenInputAmount.toString();
    }
    // se obtiene el dinero dado del cliente y el obtenido finalmente por el tpv
    const takenAmount = this._getTakenAmount(givenInputAmount, pendiente);
    // se actualiza método o se introduce nuevo según si ya existe o no
    const index = this._listOfPaymentsContainsPayment(metodo.id, currencyPaymentMethod.id);
    if ((index >= 0) && (metodo.type == PaymentMethodType.cash)) {
      this.listOfPayments[index].primaryCurrencyTakenAmount += takenAmount;
      this.listOfPayments[index].primaryCurrencyGivenAmount += givenInputAmount;
      // Redondeo a dos decimales
      this.listOfPayments[index].primaryCurrencyTakenAmount = +this.listOfPayments[index].primaryCurrencyTakenAmount.toFixed(2);
      this.listOfPayments[index].primaryCurrencyGivenAmount = +this.listOfPayments[index].primaryCurrencyGivenAmount.toFixed(2);
    } else {
      this.listOfPayments.unshift({
        paymentMethodId: metodo.id,
        paymentDateTime: new Date(),
        currencyId: currencyPaymentMethod.id,
        changeFactorFromBase: currencyPaymentMethod.changeFactorFromBase,
        primaryCurrencyTakenAmount: takenAmount,
        primaryCurrencyGivenAmount: givenInputAmount, // > takenAmount ? takenAmount : givenInputAmount,
        secondaryCurrencyTakenAmount: secondaryTakenAmount,
        secondaryCurrencyGivenAmount: secondaryGivenAmount,
        method: metodo
      });
    }
  }

  // compruebo que el metodo de pago no esta en el array y si lo esta devuelvo el indice del mismo
  private _listOfPaymentsContainsPayment(paymentMethodId: string, currencyId: string): number {
    return this.listOfPayments.findIndex(it => it.paymentMethodId == paymentMethodId && it.currencyId == currencyId);
  }

  // obtiene el valor monetario que guarda el TPV
  // si se da más dinero que el pendiente, el TPV solo guardará el pendiente
  // si se da menos dinero que el pendiente, el TPV guardará solo la cantidad introducida
  private _getTakenAmount(givenInputAmount: number, pendiente: number) {
    if (pendiente >= givenInputAmount) {
      return givenInputAmount;
    } else {
      return pendiente;
    }
  }

  // se borran todos los pagos introducidos y se resetean los valores
  deleteAllPayments() {
    this.pendiente = +this.documentGroup.pendingAmountWithTax.toFixed(2);

    this.listOfPayments = [];
    this.changeDelivered = 0;

    this._changeVisibilityActions(this.pendiente <= 0);
  }

  // se actualiza el cambio, el pendiente y se dejan de mostrar los botones de finalizar acción
  deleteFromlistOfPayments(item: PaymentDetail) {
    let sumGiven = 0, metallicPayment: PaymentDetail, indexPaymentDelete: number;
    if (this.listOfPayments != undefined) {
      sumGiven = this.recalculoPendienteDeudasFugas();
    } else {
      sumGiven = this.documentGroup.totalAmountWithTax;
    }
    // sumamos las cantidades cogidas salvo del pago a eliminar
    this.listOfPayments.forEach((payment, index) => {
      if (payment.paymentMethodId == item.paymentMethodId && payment.currencyId == item.currencyId) {
        indexPaymentDelete = index;
        // si es el metodo a eliminar, no hacemos nada
        return;
      }
      sumGiven -= payment.primaryCurrencyGivenAmount;
      if (payment.method.type == PaymentMethodType.cash) {
        metallicPayment = payment;
      }
    });
    // si el el given es superior al total del documento, existira cambio, solo si existe metalico
    if (sumGiven > this.documentGroup.totalAmountWithTax && metallicPayment != undefined) {
      this.changeDelivered = this._roundPipe.transformInBaseCurrency(sumGiven - this.documentGroup.totalAmountWithTax);
      // actualizo la cantidad taken del medio de pago metalico
      metallicPayment.primaryCurrencyTakenAmount =
        this._roundPipe.transformInBaseCurrency(metallicPayment.primaryCurrencyGivenAmount - this.changeDelivered);
      if (metallicPayment.secondaryCurrencyGivenAmount != undefined) {
        metallicPayment.secondaryCurrencyTakenAmount =
          this._roundPipe.transformInSecondaryCurrency(metallicPayment.primaryCurrencyTakenAmount * metallicPayment.changeFactorFromBase);
      }
      this.pendiente = 0;
    } else if (sumGiven == this.documentGroup.totalAmountWithTax) {
      this.pendiente = sumGiven;

      if (item.method.type == PaymentMethodType.cash) {
        this.changeDelivered = 0;
      }
    } else {
      // given es inferior o igual al total. O no hay metalico
      if (item.method.type == PaymentMethodType.cash) {
        this.changeDelivered = 0;
      }
      if (metallicPayment != undefined) {
        metallicPayment.primaryCurrencyTakenAmount = metallicPayment.primaryCurrencyGivenAmount;
        if (metallicPayment.secondaryCurrencyGivenAmount != undefined) {
          metallicPayment.secondaryCurrencyTakenAmount =
            this._roundPipe.transformInSecondaryCurrency(metallicPayment.primaryCurrencyTakenAmount * metallicPayment.changeFactorFromBase);
        }
      }
    }
    this._changeVisibilityActions(this.pendiente <= 0);
    this.listOfPayments.splice(indexPaymentDelete, 1);

    if (this.listOfPayments.length !== 0) {
      this.pendiente += +item.primaryCurrencyGivenAmount.toFixed(2);
    } else {
      if (this.documentGroup.pendingAmountWithTax != undefined) {
        this.pendiente = +this.documentGroup.pendingAmountWithTax.toFixed(2);
      } else {
        this.pendiente = +this.documentGroup.totalAmountWithTax.toFixed(2);
      }
    }

    // Redondeamos pendiente
    this.pendiente = +this.pendiente.toFixed(2);

    // actualiza cantidad ofrecida si hay método de pago seleccionado
    if (this.selectedIndex != undefined) {
      this.payment(this.selectedIndex);
    }
    this._setDefaultSelectedPaymentMethod();
  }

  recalculoPendienteDeudasFugas(): number {
    this.SubTotalDeudas = 0;
    if (this.listOfPayments != undefined) {
      this.listOfPayments.forEach((paymentDetailCalc: { primaryCurrencyGivenAmount: number; }) => {
        this.SubTotalDeudas += paymentDetailCalc.primaryCurrencyGivenAmount;
      });
    }

    return (this.SubTotalDeudas);
  }

  private _changeVisibilityActions(showActionsVisibility: boolean) {
    // muestra acciones si se permite pago pendiente a clientes identificados o si expresamente se indica
    this.showActions = (this.allowPending && !this._customerInternalService.isUnknownCustomer(this.documentGroup.cliente.id))
      || showActionsVisibility;
  }

  // si el importe a introducir es modificado con segunda divisa,
  // se actualiza el valor del dinero pendiente mostrado en divisa base en la UI
  setInfoAboutPaymentSecondaryCurrency() {
    if (this.selectedIndex && this.paymentMethodList) {
      if (this.paymentMethodList[this.selectedIndex].currencyType == CurrencyPriorityType.secondary) {
        this.inputNumberInBaseCurrency =
          this._roundPipe.transformInBaseCurrency(this._convertSecondaryToBase((Number)(this.inputNumber)));
      }
    }
  }

  requestCollectClick() {
    this.requestEndSale(false);
  }

  // se envia la venta con los métodos de pago y cuantías que se hayan elegido
  private requestEndSale(emitirFactura: boolean) {
    this._requestEndSaleCOFO(emitirFactura);
  }

  private _requestEndSaleCOFO(emitirFactura: boolean) {
    this.documentGroup.cambio = this.changeDelivered != undefined ? this.changeDelivered : 0.00;
    // se ha eliminado la parte de factura por que no se genera desde esta funcionalidad

    if (this._requestingSendSale) {
      return;
    }
    this._requestingSendSale = true;

    this._mixtPaymentService
      .requestEndSaleMulti(this.documentGroup, this.listOfPayments, emitirFactura,
        this._paymentPurpose, this.changeDelivered, this.pendiente)
      .first().subscribe(endSaleResult => {
        // this._appDataConfig.paymentMethodList = this.paymentMethodListOriginal;
        this._mixtPaymentService.manageSaleEnded(endSaleResult);
        this._requestingSendSale = false;
        this._onMixtPayment.next(endSaleResult);
      });

  }

  // * Comprobamos si hay lineas de articulos que han sido anuladas en la venta
  //   y si el total neto de cantidades de artículos de un tipo es positivo.
  // * Si solo hay carburantes en el neto, limpiamos el resto de cosas.
  ComprobarLimpiarLineasArt(documento: Document): boolean {
    let hayArtTienda = false;

    const listaAux: DocumentLine[] = [];
    const listaNeg: DocumentLine[] = [];
    const listaPos: DocumentLine[] = [];

    let banderaElim: boolean = false;

    documento.lines.forEach(linea => {
      if (linea.quantity < 0) {
        listaNeg.push(linea);
      }
      else {
        listaPos.push(linea);
      }
    });

    listaPos.forEach(lineaPos => {

      listaNeg.forEach((lineaNeg, index) => {

        if (banderaElim == false &&
          (lineaPos.appliedPromotionList == undefined || lineaPos.appliedPromotionList.length == 0) &&
          lineaPos.productId == lineaNeg.productId && lineaPos.quantity == -lineaNeg.quantity) {
          banderaElim = true;
          listaNeg.splice(index, 1);
        }

      });

      if (banderaElim == false) {
        listaAux.push(lineaPos);
      }

      banderaElim = false;
    });

    if (listaAux.filter((item) => item.typeArticle.indexOf('TIEN') > 0).length > 0) {
      hayArtTienda = true;
    }
    else {
      documento.lines = listaAux;
    }

    return hayArtTienda;
  }

  // si es la segunda divisa, se recomienda el pago en esa divisa
  // mientras no se supla la cantidad pendiente se suma la cantidad correspondiente
  inputNumberToSecundaryCurrencySupplyingPending(inputNumber: number): number {
    // cantidad a introducir a segunda divisa y con decimales posibles
    let inputNumberToSecundaryCurrency = this._convertBaseToSecondary((Number)(inputNumber));
    // convertimos ese valor a la moneda base para saber si al recortar decimales no se llega a la cantidad a pagar
    let inputNumberToBaseCurrency = this._convertSecondaryToBase((Number)(inputNumberToSecundaryCurrency));
    // si no se llega a la cantidad a pagar se empiezan a sumar decimales hasta llegar a la cantidad
    while (inputNumberToBaseCurrency < this.pendiente) {
      inputNumberToSecundaryCurrency += (1 / Math.pow(10, this.secondaryCurrency.decimalPositions));
      inputNumberToSecundaryCurrency = this._roundPipe.transformInSecondaryCurrency(inputNumberToSecundaryCurrency);
      inputNumberToBaseCurrency = this._convertSecondaryToBase((Number)(inputNumberToSecundaryCurrency));
    }
    return inputNumberToSecundaryCurrency;
  }

  isButtonDisabled() {
    return this._requestingSendSale || (this.listOfPayments != undefined && this.listOfPayments.length == 0) || this.pendiente > 0;
  }

  // ej: si la base es €, 1 euro son 166.386 pesetas
  private _convertBaseToSecondary(amount: number): number {
    let amountInSecondaryCurrency;
    if (this.secondaryCurrency) {
      amountInSecondaryCurrency = this._roundPipe.transformInSecondaryCurrency(amount * this.secondaryCurrency.changeFactorFromBase);
    }
    return amountInSecondaryCurrency;
  }

  // ej: si la base es €, 1 euro son 166.386 pesetas
  private _convertSecondaryToBase(amount: number): number {
    let amountInBaseCurrency;
    if (this.secondaryCurrency) {
      amountInBaseCurrency = this._roundPipe.transformInBaseCurrency(amount / this.secondaryCurrency.changeFactorFromBase);
    }
    return amountInBaseCurrency;
  }

  // se introduce una cantidad de dinero a pagar y se recalculan datos como el pendiente y el cambio
  setPayment(): void {
    if (this._validatePayment() == true) {
      if (this.paymentMethodList[this.selectedIndex].type !== PaymentMethodType.cash && Number(this.inputNumber) >= this.pendiente) {
        // si el medio de pago es credito local realizamos las validaciones correspondientes
        if (this.paymentMethodList[this.selectedIndex].id.substring(5) == PaymentMethodType.localcredit.toString()) {
          if (this.documentGroup.cliente.riesgo1 > 0) {
            if (this.documentGroup.cliente.riesgo1 >= (this.pendiente + this.documentGroup.cliente.riesgo2)) {
              // si no es efectivo y se introduce más cantidad de lo que hay que pagar
              // se inserta como cantidad introducida SOLO lo que haya que pagar
              this._insertPayment(this.paymentMethodList[this.selectedIndex], this.pendiente, this.pendiente);
              this.pendiente = 0;
              this._statusBarService.publishMessage(this.getLiteral('mixt_payment_component', 'message_MixtPayment_PayMethodAddCorrectly'));
            } else {
              this._statusBarService.publishMessage(this.getLiteral('mixt_payment_component',
                'message_MixtPayment_ReachedMaximumCreditHaveLeft') + ' '
                + (this.documentGroup.cliente.riesgo1 - this.documentGroup.cliente.riesgo2).toFixed(2) + ' €');
              // Quitamos La Selección de Credito local y ponemos el valor por defecto
              this.selectedIndex = 0;
            }
          } else {
            this._statusBarService.publishMessage(this.getLiteral('mixt_payment_component', 'message_MixtPayment_ClientNotHaveCreditActive'));
            // Quitamos La Selección de Credito local y ponemos el valor por defecto
            this.selectedIndex = 0;
          }
        } else {
          // si no es efectivo y se introduce más cantidad de lo que hay que pagar
          // se inserta como cantidad introducida SOLO lo que haya que pagar
          this._insertPayment(this.paymentMethodList[this.selectedIndex], this.pendiente, this.pendiente);
          this._statusBarService.publishMessage(this.getLiteral('mixt_payment_component', 'message_MixtPayment_PayMethodAddCorrectly'));
          this.pendiente = 0;
        }
      } else {
        // si es efectivo o se introduce una cantidad menor que el pendiente
        // se inserta como cantidad introducida la que haya sido
        // se calcula el nuevo pendiente y el posible cambio solo si es efectivo
        this._insertPayment(this.paymentMethodList[this.selectedIndex], Number(this.inputNumber), this.pendiente);
        this.pendiente -= Number(this.inputNumber);
        this.pendiente = this._roundPipe.transformInBaseCurrency(this.pendiente);
        // No es necesario cambio en pagos mixto
        if (this.pendiente <= 0) {
          this.changeDelivered = -(this.pendiente);
        }
        this._statusBarService.publishMessage(this.getLiteral('mixt_payment_component', 'message_MixtPayment_PayMethodAddCorrectly'));
      }
    }
    // si ya se ha llegado al pendiente se mira si hay cambio y se muestran acciones
    if (this.pendiente <= 0) {
      this.pendiente = 0;
      this._changeVisibilityActions(true);
    }
    this._resetPaymentIntroduction();
  }

  // resetea datos de la introducción de un pago (pendiente y medio de pago seleccionado por defecto)
  private _resetPaymentIntroduction() {
    this.inputNumber = '0';
    this._setDefaultSelectedPaymentMethod();
  }

  // medio de pago seleccionado por defecto y actualiza cantidad recomendada a introducir como próximo pago
  private _setDefaultSelectedPaymentMethod() {
    if (this.paymentMethodList && this.paymentMethodList.length > 0 && this.pendiente > 0) {
      this.selectedIndex = 1;
      this.payment(this.selectedIndex);
    } else {
      this.selectedIndex = undefined;
    }
  }

  private _validatePayment(): boolean {
    // debe de haber un método de pago seleccionado
    if (this.selectedIndex == undefined) {
      return false;
    }
    // solo se añade pago si aún queda dinero pendiente
    if (this.pendiente <= 0) {
      return false;
    }
    // no se puede introducir una cantidad 0
    const inputAmount = (Number)(this.inputNumber);
    if (isNaN(inputAmount) || inputAmount <= 0) {
      return false;
    }
    // solo cantidades con x o menos decimales según divisa
    this._validateInputNumber();
    return true;
  }

  // no se permite introducir más decimales de los que permite la divisa
  // redondeamos el número según los decimales que si están permitidos
  private _validateInputNumber(): void {
    const inputNumberString = this.inputNumber + '';
    if (inputNumberString) {
      const decimalsOfNumber = inputNumberString.split('.')[1];
      if (decimalsOfNumber && this.currencySelected && decimalsOfNumber.length > this.currencySelected.decimalPositions) {
        if (this.currencySelected.priorityType == CurrencyPriorityType.base) {
          this.inputNumber = this._roundPipe.transformInBaseCurrency((Number)(this.inputNumber)).toString();
        } else {
          this.inputNumber = this._roundPipe.transformInSecondaryCurrency((Number)(this.inputNumber)).toString();
        }
      }
    }
  }

  triggleClickEventOnInput() {
    // valido que el click solo se hará solo si hay dinero pendiente
    if (this.pendiente > 0 && this._paymentPurpose !== PaymentPurpose.Refund) {
      // Despacho click event en el input para que se abra el teclado
      // Create the event.
      const event = document.createEvent('Event');
      // init event
      event.initEvent('click', false, true);
      // dispatch event
      this.inputPayment.nativeElement.dispatchEvent(event);
    }
  }

  setInputFocus() {
    if (this.inputPayment) {
      (this.inputPayment.nativeElement as HTMLElement).focus();
      (this.inputPayment.nativeElement as HTMLElement).click();
    }
  }

  private _setMixtHeight() {
    setTimeout(() => {
      const calcBtnHeight = Number(jQuery('.tpv-mixt-payment-multi .tpv-mixt-input').css('height').replace('px', ''));
      const calcBtnBottomHeight = Number(jQuery('.tpv-mixt-payment-multi .button-bottom').css('height').replace('px', ''));
      const calcTitleHeight = Number(jQuery('.tpv-mixt-payment-multi .auxiliar-action-title').css('height').replace('px', ''));
      const calcHeight = jQuery('.tpv-slide-over').height() -
        (calcBtnHeight + calcTitleHeight + calcBtnBottomHeight +
          jQuery('.tpv-mixt-payment-multi .tpv-mixt-payment-method').height() +
          jQuery('.tpv-mixt-payment-multi .tpv-mixt-payment-amount').height());
      jQuery('.tpv-mixt-payment-multi .divOverflow').css('height', calcHeight);
    }, 500);
  }

  getLiteral(group: string, key: string): string {
    return this._languageService.getLiteral(group, key);
  }
}
