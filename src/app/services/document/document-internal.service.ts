import { Injectable } from '@angular/core';
import { Subject } from 'rxjs/Subject';

import { RoundPipe } from 'app/pipes/round.pipe';
import { DocumentLine } from 'app/shared/document/document-line';
import { Document } from 'app/shared/document/document';
import { Observable } from 'rxjs/Observable';
import { FuellingPointSupplyLine } from 'app/shared/fuelling-point/fuelling-point-supply-line';
import { SuplyTransaction } from 'app/shared/fuelling-point/suply-transaction';
import { LockedSuplyTransaction } from 'app/shared/fuelling-point/locked-suply-transaction';
import { OperatorInternalService } from 'app/services/operator/operator-internal.service';
import { IbusinessSpecificLine } from 'app/shared/ibusiness-specific-line';
import { DocumentSeriesService } from 'app/services/document/document-series.service';
import { AppDataConfiguration } from 'app/config/app-data.config';
import { GenericHelper } from 'app/helpers/generic-helper';
import { SeriesType } from 'app/shared/series/series-type';
import { FinalizingDocumentFlowType } from 'app/shared/document/finalizing-document-flow-type.enum';
import { CustomerService } from '../customer/customer.service';
import { Customer } from '../../shared/customer/customer';
import { SignalROPOSService } from 'app/services/signalr/signalr-opos.service';
import { OPOSWriteDisplayResponseStatuses } from 'app/shared/hubble-pos-signalr-responses/opos-writedisplay-response-statuses.enum';
import { Subscriber } from 'rxjs/Subscriber';
// import { StatusBarService } from 'app/services/status-bar/status-bar.service';
import { LanguageService } from '../language/language.service';
// import { StatusBarService } from 'app/services/status-bar/status-bar.service';
import { CustomerSelectedResult } from 'app/shared/customer/customer-selected-result';
import { DocumentSearchInternalService } from './document-search-internal.service';
import { SearchDocumentMode } from 'app/shared/document-search/search-document-mode.enum';
// import { StatusBarService } from 'app/services/status-bar/status-bar.service';
import { TpvMainService } from 'app/services/tpv/tpv-main.service';
import { ElectronicJournalService } from 'app/services/electronic-journal/electronic-journal.service';
import { ActionType } from 'app/shared/electronic-journal/action-type.enum';

@Injectable()
export class DocumentInternalService {

  private _currentDocumentList: Array<Document> = [];

  private _selectedDocumentIndex = 0;

  // linea que se obtendrá cuando el usuario pulse sobre un producto
  private _requestLineInsertion: Subject<DocumentLine> = new Subject();
  private _requestLineDeletion: Subject<number> = new Subject();
  private _promotionAddedSubject: Subject<any> = new Subject();

  // Limpiar lineas del documento
  private _cleanDucumentLines: Subject<any> = new Subject();
  // comunicar reset del document
  private _resetDocument: Subject<{ result: boolean, mustResetOperator: boolean }> = new Subject();
  private _previewPromotionsRequested: Subject<any> = new Subject();
  private _resetDocumentData: Subject<{ result: boolean }> = new Subject();
  private _clearDocumentData: Subject<{ result: boolean }> = new Subject();

  private _resetDocumentDataFail: Subject<{ result: boolean }> = new Subject();

  // comunicar el customer de document-actions
  _sendCustomerSelected: Subject<CustomerSelectedResult> = new Subject<CustomerSelectedResult>();

  /**  TODO: Esta configuración de decimales tiene que venir por configuración
  *   - string` which has a following format: <br>
  *      <code>{minIntegerDigits}.{minFractionDigits}-{maxFractionDigits}</code>
  *   - `minIntegerDigits` is the minimum number of integer digits to use. Defaults to `1`.
  *   - `minFractionDigits` is the minimum number of digits after fraction. Defaults to `0`.
  *   - `maxFractionDigits` is the maximum number of digits after fraction. Defaults to `3`.
  * @private
  * @memberof EditDocumentLineComponent
  */

  // todas las líneas de un document
  lines = new Array<DocumentLine>();
  countLines: number;

  constructor(
    private _roundPipe: RoundPipe,
    private _operatorInternalSvc: OperatorInternalService,
    private _documentSerieSvc: DocumentSeriesService,
    private _customerService: CustomerService,
    private _appDataConfig: AppDataConfiguration,
    // private _statusBarService: StatusBarService,
    private _signalROPOSService: SignalROPOSService,
    private _languageService: LanguageService,
    private _docSearchSvc: DocumentSearchInternalService,
    private _tvpMainSvc: TpvMainService,
    private _electronicJournal: ElectronicJournalService,

  ) { }

  setCustomerSelected(value: CustomerSelectedResult) {
    this._sendCustomerSelected.next(value);
  }

  getCustomerSelected(): Observable<CustomerSelectedResult> {
    return this._sendCustomerSelected.asObservable();
  }

  // Actualizar la lista de documentos
  set currentDocumentList(documentList: Array<Document>) {
    // TODO: Para la reingeniería hay que decidir si esto debería ser una asignación de referencia
    //       o se debería hacer una copia. Del mismo modo hay que decidir si la lista original la
    //       'guarda' este servicio y el documento (y el resto de componentes) la lee y/o modifica
    if (documentList == undefined) {
      this._currentDocumentList = [];
    } else {
      this._currentDocumentList = documentList;
    }
  }

  // obtener la lista de documentos
  get currentDocumentList(): Array<Document> {
    return this._currentDocumentList;
  }

  // Actualiza el índice del documento actual
  set selectedDocumentIndex(index: number) {
    if (this._selectedDocumentIndex != index) {
      // Electronic Journal - selectedDocumentChanged
      this._electronicJournal.writeAction({
        type: ActionType.selectedDocumentChanged,
        previousDocument: this._selectedDocumentIndex.toString(),
        selectedDocument: index.toString(),
      });
    }
    this._selectedDocumentIndex = index;
    this._electronicJournal.currentOperator = this._currentDocumentList[index].operator;
  }

  set documentLockStatus(locked: boolean) {
    this.currentDocument.isLocked = locked;
  }
  // Por ahora usaremos este servicio como almacén principal para quien quiera consultar el documento
  get currentDocument(): Document {
    return this._currentDocumentList[this._selectedDocumentIndex];
  }

  /**
   * Devuelve el index del documento activo
   */
  get currentDocumentIndex(): number {
    return this._selectedDocumentIndex;
  }
  documentResetRequested(): Observable<{ result: boolean, mustResetOperator: boolean }> {
    return this._resetDocument.asObservable();
  }
  resetDocumentRequested(): Observable<{ result: boolean }> {
    return this._resetDocumentData.asObservable();
  }
  documentClear(): Observable<{ result: boolean }> {
    return this._clearDocumentData.asObservable();
  }
  resetDocumentFailRequested(): Observable<{ result: boolean }> {
    return this._resetDocumentDataFail.asObservable();
  }

  lineInsertionRequested(): Observable<DocumentLine> {
    return this._requestLineInsertion.asObservable();
  }

  linePromotionAdded(): Observable<any> {
    return this._promotionAddedSubject.asObservable();
  }

  onPreviewPromotions(): Observable<any> {
    return this._previewPromotionsRequested.asObservable();
  }

  previewPromotions() {
    this._previewPromotionsRequested.next(undefined);
  }

  /**
   *
   * @returns {boolean} Returns true if any of the documents has lines. Otherwise, false.
   * @memberof DocumentInternalService
   */
  isAnyActiveDocumentWithLines(): boolean {
    return this._currentDocumentList != undefined &&
      this._currentDocumentList.find(d => d.lines != undefined && d.lines.length > 0) != undefined;
  }

  // ------------------------------------------------------------------------------------------------

  // para pasar la línea y sus datos al documento
  // primero se edita su id por un guid y se redondean decimales
  publishLineData(data: DocumentLine): number {
    if (!this.currentDocument.customer || !this.currentDocument.operator) {
      return undefined;
    }

    // data.priceWithTax = this._roundPipe.transformInBaseCurrency(data.priceWithTax);
    data.discountPercentage = this._roundPipe.transformInBaseCurrency(data.discountPercentage);
    data.totalAmountWithTax = this._roundPipe.transformInBaseCurrency(data.totalAmountWithTax);
    if (data.priceWithoutTax == undefined || data.priceWithoutTax == 0) {
      // no está seteado el precio sin impuesto
      if (data.taxPercentage == undefined || data.priceWithTax == undefined) {
        throw Error
          // tslint:disable-next-line:max-line-length
          (this._getLiteral('document_internal_service', 'error_throw_InformationIncomplete'));
      }
      const taxAmount = this._roundPipe.transform(
        data.priceWithTax - (data.priceWithTax / (1 + (data.taxPercentage / 100))),
        this._appDataConfig.decimalPrecisionConfiguration.decimalPositionsForUnitPricesWithoutTax);
      data.priceWithoutTax = data.priceWithTax - taxAmount;
    }
    this._requestLineInsertion.next(data);
    if (!this.lines) {
      this.lines = new Array<DocumentLine>();
    }
    if (!data.PVPLocal) {
      this._btnWriteDisplayArticle(data); // Pana - Enviar el articulo al visor
    }

    this.lines.push(data);
    this.countLines = this.lines.length;
    return this.lines.length;
  }

  publishLineDataForSetPromotion(data: DocumentLine): number {
    if (!this.currentDocument.customer || !this.currentDocument.operator) {
      return undefined;
    }

    // data.priceWithTax = this._roundPipe.transformInBaseCurrency(data.priceWithTax);
    data.discountPercentage = this._roundPipe.transformInBaseCurrency(data.discountPercentage);
    data.totalAmountWithTax = this._roundPipe.transformInBaseCurrency(data.totalAmountWithTax);
    if (data.priceWithoutTax == undefined || data.priceWithoutTax == 0) {
      // no está seteado el precio sin impuesto
      if (data.taxPercentage == undefined || data.priceWithTax == undefined) {
        throw Error
          // tslint:disable-next-line:max-line-length
          (this._getLiteral('document_internal_service', 'error_throw_InformationIncomplete'));
      }
      const taxAmount = this._roundPipe.transform(
        data.priceWithTax - (data.priceWithTax / (1 + (data.taxPercentage / 100))),
        this._appDataConfig.decimalPrecisionConfiguration.decimalPositionsForUnitPricesWithoutTax);
      data.priceWithoutTax = data.priceWithTax - taxAmount;
    }
    // data.ticket = this.selectedDocumentIndex + 1;
    this.currentDocument.lines.push(data);
    // this._documentChanged();  ---> No se notifica el cambio en el ticket: si no llamaríamos de nuevo al servicio para
    //                                calcular promos
    this._tvpMainSvc.setPluVisible(true);
    // tslint:disable-next-line:max-line-length
    // this._statusBarService.publishMessage(
    //  `${this.getLiteral('document_component', 'message_StatusBar_ArticleAdd')} ${this.selectedDocumentIndex + 1}`);
    if (!this.lines) {
      this.lines = new Array<DocumentLine>();
    }
    // if (!data.PVPLocal) {
    //  this._btnWriteDisplayArticle(data); // Pana - Enviar el articulo al visor
    // }

    this.lines.push(data);
    this.countLines = this.lines.length;
    return this.lines.length;
  }

  notifyPromotionAdded() {
    this._promotionAddedSubject.next(1);
  }
  // informa de que hay que borrar las líneas introducidas en el documento
  deleteDocumentData(mustResetOperator: boolean = false) {
    this._resetDocument.next({ result: true, mustResetOperator });
  }

  resetDocumentData(result: boolean = true) {
    this._resetDocumentData.next({ result });
  }

  clearDocumentData(result: boolean = true) {
    this._clearDocumentData.next({ result });
  }

  resetDocumentDataFail(result: boolean = true) {
    this._resetDocumentDataFail.next({ result });
  }

  cloneDocument(origen: Document): Document {
    if (origen == undefined) { return undefined; }
    // const clonedDocument = {...origen};
    const clonedDocument: Document = GenericHelper.deepCopy(origen);
    clonedDocument.lines.forEach(line => {
      line.businessSpecificLineInfo = undefined;
    });

    return clonedDocument;
  }

  /**
   * Indica si la transaccion ha sido incluida en alguna linea de algun documento del tpv
   * @param transaction Transaccion a buscar
   */
  hasTransaction(transaction: SuplyTransaction): boolean {
    for (const documento of this._currentDocumentList) {
      for (const linea of documento.lines) {
        const supplySpecificLine = linea.businessSpecificLineInfo as FuellingPointSupplyLine;
        if (supplySpecificLine == undefined || supplySpecificLine.supplyTransaction == undefined) {
          continue;
        }
        if (supplySpecificLine.supplyTransaction.id == transaction.id) {
          return true;
        }
      }
    }
    return false;
  }
  hasTransactionLockingPosId(transaction: SuplyTransaction): boolean {
    if (transaction.lockingPOSId) {
      if (transaction.fuellingLimitValue > 0) {
        return false;
      }
      return  true;
    } else {
      return false;
    }
  }

  /**
   * Indica si existe algun documento con alguna operacion insertada
   */
  hasAnyDocumentWithLine(): boolean {
    for (const document of this._currentDocumentList) {
      if (document.lines != undefined && document.lines.length > 0) {
        return true;
      }
    }
    return false;
  }
  /**
   * Crea un documento a partir de la respuesta de la solicitud de bloqueo de una transaccion de devolucion.
   * @param transactionLineInfo informacion para generar una linea de documento referente a la devolucion de la transaccion
   * @param businessSpecificLineInfo [opcional] indica la información para linea especifica de negocio (acciones a realizar al completar o eliminar)
   */
  createDocumentForRefund(transactionLineInfo: LockedSuplyTransaction, businessSpecificLineInfo?: IbusinessSpecificLine
    , fuellingPointId?: number): Document {
    const priceWithTax = transactionLineInfo.unitaryPricePreDiscount;
    const taxPercentage = transactionLineInfo.taxPercentage;
    const priceWithoutTax = this._roundPipe.transformInBaseCurrency(priceWithTax / (1 + (taxPercentage / 100)));
    this._customerService.getCustomerById(transactionLineInfo.customerId).subscribe((customer: Customer) => {
      this.currentDocument.customer = customer;
    });
    // todo recuperar customer desde servicio?
    const document: Document = {
      customer: {
        id: transactionLineInfo.customerId,
        tin: this.currentDocument.customer.tin,
        businessName: this.currentDocument.customer.businessName,
        addressList: [],
        riesgo1: this.currentDocument.customer.riesgo1,
        riesgo2: this.currentDocument.customer.riesgo2
      },
      operator: this._operatorInternalSvc.currentOperator,
      currencyId: this._appDataConfig.baseCurrency.id,
      lines: [{
        productId: transactionLineInfo.productId,
        quantity: transactionLineInfo.correspondingVolume,
        discountPercentage: transactionLineInfo.discountPercentage,
        description: 'S: ' + fuellingPointId + ' ' + transactionLineInfo.productName,
        priceWithTax: priceWithTax,
        discountAmountWithTax: transactionLineInfo.discountedAmount,
        totalAmountWithTax: transactionLineInfo.finalAmount,
        taxPercentage: taxPercentage,
        businessSpecificLineInfo: businessSpecificLineInfo,
        priceWithoutTax: priceWithoutTax,
        taxAmount: 0,
        originalPriceWithTax: priceWithTax,
        typeArticle: transactionLineInfo.typeArticle,
        isConsigna: transactionLineInfo.isConsigna,
        idCategoria: '',
        nameCategoria: ''
      }],
      series: this._documentSerieSvc.getSeriesByFlow(transactionLineInfo.serieType == SeriesType.ticket ?
        FinalizingDocumentFlowType.EmittingDevolutionForTicket : FinalizingDocumentFlowType.EmittingDevolutionForBill,
        transactionLineInfo.finalAmount),
      totalAmountWithTax: transactionLineInfo.finalAmount,
      discountAmountWithTax: transactionLineInfo.discountedAmount,
      discountPercentage: transactionLineInfo.discountPercentage,
      referencedDocumentIdList: [transactionLineInfo.sourceDocumentId],
      referencedDocumentNumberList: [transactionLineInfo.sourceDocumentNumber],
      posId: this._appDataConfig.userConfiguration.posId
    };
    return document;
  }


  createDocumentForRefundObservable(transactionLineInfo: LockedSuplyTransaction, businessSpecificLineInfo?: IbusinessSpecificLine
    , fuellingPointId?: number): Observable<Document> {
    return Observable.create((subscriber: Subscriber<Document>) => {
      const priceWithTax = transactionLineInfo.unitaryPricePreDiscount;
      const taxPercentage = transactionLineInfo.taxPercentage;
      const priceWithoutTax = this._roundPipe.transformInBaseCurrency(priceWithTax / (1 + (taxPercentage / 100)));
      this._customerService.getCustomerById(transactionLineInfo.customerId).subscribe((customer: Customer) => {
        // this.currentDocument.customer = customer;
        this._docSearchSvc.getDocument(transactionLineInfo.sourceDocumentId, SearchDocumentMode.Copy)
          .first()
          .subscribe(docResponse => {
            const document: Document = {
              customer: {
                id: transactionLineInfo.customerId,
                tin: customer.tin,
                businessName: customer.businessName,
                addressList: [],
                riesgo1: customer.riesgo1,
                riesgo2: customer.riesgo2,
                matricula: docResponse.document.plate
              },
              operator: this._operatorInternalSvc.currentOperator,
              currencyId: this._appDataConfig.baseCurrency.id,
              lines: [{
                productId: transactionLineInfo.productId,
                quantity: transactionLineInfo.correspondingVolume,
                discountPercentage: transactionLineInfo.discountPercentage,
                description: 'S: ' + fuellingPointId + ' ' + transactionLineInfo.productName,
                priceWithTax: priceWithTax,
                discountAmountWithTax: transactionLineInfo.discountedAmount,
                totalAmountWithTax: transactionLineInfo.finalAmount,
                taxPercentage: taxPercentage,
                businessSpecificLineInfo: businessSpecificLineInfo,
                priceWithoutTax: priceWithoutTax,
                taxAmount: 0,
                originalPriceWithTax: priceWithTax,
                typeArticle: transactionLineInfo.typeArticle,
                isConsigna: transactionLineInfo.isConsigna,
                idCategoria: '',
                nameCategoria: ''
              }],
              series: this._documentSerieSvc.getSeriesByFlow(transactionLineInfo.serieType == SeriesType.ticket ?
                FinalizingDocumentFlowType.EmittingDevolutionForTicket : FinalizingDocumentFlowType.EmittingDevolutionForBill,
                transactionLineInfo.finalAmount),
              totalAmountWithTax: transactionLineInfo.finalAmount,
              discountAmountWithTax: transactionLineInfo.discountedAmount,
              discountPercentage: transactionLineInfo.discountPercentage,
              referencedDocumentIdList: [transactionLineInfo.sourceDocumentId],
              referencedDocumentNumberList: [transactionLineInfo.sourceDocumentNumber],
              posId: this._appDataConfig.userConfiguration.posId
            };
            subscriber.next(document);
          });
      });
      // todo recuperar customer desde servicio?

    });

  }

  deleteLine(index: number) {
    this._requestLineDeletion.next(index);
  }

  lineDeletionRequested(): Observable<number> {
    return this._requestLineDeletion.asObservable();
  }

  cleanDocumentLines() {
    this._cleanDucumentLines.next();
  }

  cleanDocumentLinesRequested(): Observable<any> {
    return this._cleanDucumentLines.asObservable();
  }

  // Pana - Cajon y Visor - 12/03/2019
  // talonsoc - añadir dos decimales cuando el precio es un entero - 14/10/19
  private _btnWriteDisplayArticle(data: DocumentLine) {
    this.OPOS_WriteDisplayArticle(data.description, data.typeArticle.includes('COMBU')
      ? data.quantity.toString() + ' L'
      : data.quantity.toString() + ' x ' +  (data.pricelocal != undefined ? GenericHelper.ToStringWithDecimals(data.pricelocal) :
      GenericHelper.ToStringWithDecimals(data.priceWithTax)) + ' ' + this._appDataConfig.baseCurrency.symbol)
      .first().subscribe(response => {
        /*if (response) {
          this._statusBarService.publishMessage('mensaje enviado');
        } else {
          this._statusBarService.publishMessage('no se ha podido establecer comunicacion con el visor');
        }*/
      });
  }

  private OPOS_WriteDisplayArticle(strLinea1: string, strLinea2: string): Observable<boolean> {
    return Observable.create((observer: Subscriber<boolean>) => {
      Promise.resolve(this._signalROPOSService.OPOSWriteDisplay(this.filterAcentos(strLinea1),
        this.filterAcentos(strLinea2.replace('.', ','))).then(responseOPOS => {
          if (responseOPOS.status === OPOSWriteDisplayResponseStatuses.successful) {
            observer.next(true);
          } else if (responseOPOS.status === OPOSWriteDisplayResponseStatuses.genericError) {
            observer.next(false);
          }
        }));
    });
  }

  filterAcentos(str: string) {
    return str.replace('Ó', 'O').replace('ó', 'o').replace('É', 'E').replace('é', 'e').replace('Á', 'A').
      replace('á', 'a').replace('Í', 'I').replace('Í', 'i').replace('Ú', 'U').replace('Ú', 'u');
  }
  countLinesFromDocument(): number {
    return this.countLines || 0;
  }
  setLinesFromDocument(numberLines: number): void {
    this.countLines = numberLines;
  }

  private _getLiteral(group: string, key: string): string {
    return this._languageService.getLiteral(group, key);
  }

}
