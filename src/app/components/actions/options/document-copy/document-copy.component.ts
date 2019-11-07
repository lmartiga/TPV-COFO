import { Component, OnInit, OnDestroy, HostBinding } from '@angular/core';
import { Subject } from 'rxjs/Subject';
import { Observable } from 'rxjs/Observable';
import { IActionFinalizable } from 'app/shared/iaction-finalizable';
import { Document } from 'app/shared/document/document';
import { DocumentSearchFilters } from 'app/shared/document-search/document-search-filters.enum';
import { StatusBarService } from 'app/services/status-bar/status-bar.service';
import { DocumentCopyService } from 'app/services/document/document-copy.service';
import { SearchDocumentMode } from 'app/shared/document-search/search-document-mode.enum';
import { DocumentSearchSelected } from 'app/shared/document-search/document-search-selected';
// import { DocumentSearchInternalService } from 'app/services/document/document-search-internal.service';
// import { GetDocumentResponseStatuses } from 'app/shared/web-api-responses/get-document-response-statuses.enum';
// import { FormatHelper } from 'app/helpers/format-helper';
import { DocumentLine } from 'app/shared/document/document-line';
import { ResponseStatus } from 'app/shared/response-status.enum';
import { PromotionsService } from 'app/services/promotions/promotions.service';
import { LanguageService } from 'app/services/language/language.service';
import { DocumentLinePromotion } from 'app/shared/document/document-line-promotion';
import { LogHelper } from 'app/helpers/log-helper';

@Component({
  selector: 'tpv-copia',
  templateUrl: './document-copy.component.html',
  styleUrls: ['./document-copy.component.scss']
})
export class DocumentCopyComponent implements OnInit, OnDestroy, IActionFinalizable<boolean> {
  @HostBinding('class') class = 'tpv-document-copy';

  private _onCopySaleDocument: Subject<boolean> = new Subject();

  private _documentSearchFilters: Array<DocumentSearchFilters>;

  public  currentDocument: Document;
  public  mostrarPreView: boolean;

  constructor(
    private _statusBar: StatusBarService,
    // private _docSearchSvc: DocumentSearchInternalService,
    private _documentCopyService: DocumentCopyService,
    private _promotionsSvc: PromotionsService,
    private _languageService: LanguageService,
    private  _logHelper: LogHelper
  ) {
  }

  ngOnInit() {
    this.ResetValue();
    this._documentSearchFilters = [
      DocumentSearchFilters.document,
      DocumentSearchFilters.customer,
      DocumentSearchFilters.date,
      DocumentSearchFilters.import
    ];
  }

  /**
   *Restauramos el documento para evitar que se mantengan mientras se carga otro.
   *
   * @memberof DocumentCopyComponent
   */
  ResetValue(): void{
    this.currentDocument = undefined;
    this.mostrarPreView = false;
  }

  ngOnDestroy() {
  }

  onFinish(): Observable<boolean> {
    return this._onCopySaleDocument.asObservable();
  }

  forceFinish(): void {
    this._onCopySaleDocument.next(false);
  }

  set documentSearchFilters(filters: Array<DocumentSearchFilters>) {
    this._documentSearchFilters = filters;
  }

  get documentSearchFilters(): Array<DocumentSearchFilters> {
    return this._documentSearchFilters;
  }

  onDocumentSelected(documentSearch: DocumentSearchSelected) {
    this._logHelper.trace('Documento recibido:');
    this._logHelper.trace(documentSearch);
    if (documentSearch) {
     // Buscamos el documento - COFO
     this.getDocumentCopy(documentSearch.documentSelected);
     this.mostrarPreView = true;
    }
  }

  getDocumentCopy (documento: Document) {

    this.currentDocument = documento;
    this.ProcesarDocumento(this.currentDocument);

    // Se añaden las promociones de forma correcta si tiene.
    let lineasTienda = this.currentDocument.lines.filter((item) => item.typeArticle.indexOf('TIEN') > 0)
    if(lineasTienda.length>0)
  {
    if (lineasTienda[0].appliedPromotionList != undefined && lineasTienda[0].appliedPromotionList.length > 0) {
      this._promotionsSvc.cleanLocalTarif(this.currentDocument); // Pana - Se limpian las tarifas locales si se han aplicado
      this._promotionsSvc.calculatePromotions(this.currentDocument)
        .first().subscribe(
          calculatePromotionsResponse => {
            if (calculatePromotionsResponse.status === ResponseStatus.success) {
              const receivedPromotionsList = calculatePromotionsResponse.object;
              if (receivedPromotionsList != undefined && receivedPromotionsList.length > 0) {
                this.currentDocument.lines.filter((item) => item.typeArticle.indexOf('TIEN') > 0)[0].appliedPromotionList = receivedPromotionsList;
              }
            }
            let PromotionList : Array<DocumentLinePromotion>;
            this.currentDocument.discountAmountWithTax = 0
            this.currentDocument.lines.forEach(line => {
              this._logHelper.trace(line);
              PromotionList = [];
              
              line.appliedPromotionList.forEach(dis => {
                if (dis.discountAmountWithTax > 0) {
                  PromotionList.push(dis);
                  this.currentDocument.lines.push({
                    productId: line.productId,
                    quantity: dis.numberOfTimesApplied,
                    description: dis.description,
                    priceWithTax: line.priceWithTax * -1,
                    discountPercentage: line.discountPercentage,
                    totalAmountWithTax: dis.discountAmountWithTax * -1,
                    idCategoria: '',
                    nameCategoria: ''
                  });
                  this.currentDocument.totalAmountWithTax -= dis.discountAmountWithTax;
                  this.currentDocument.discountAmountWithTax += dis.discountAmountWithTax;
                }
              });
              line.appliedPromotionList = PromotionList;
              line.appliedPromotionListHTML = PromotionList;
            });
          });
      }
    }

      if (this.currentDocument == undefined) {
        // this.errorText = 'El documento encontrado no es valido';
        // this.showError = true;
        return;
      }
      if (this.currentDocument.referencedDocumentIdList.length > 0) {
        // this.errorText = 'El documento ya esta anulado';
        // this.showError = true;
        return;
      }

  }

  onCopySelected(copiar: boolean) {
    if (copiar) {
      this._logHelper.trace('Se ha aceptado la copia del documento:');
      this._logHelper.trace(this.currentDocument);
      //Eliminamos las lineas de promocion para la impresion del ticket
      // no es necesario por que la promo esta dentro de line.
      let listaTienda: Array<DocumentLine>;
      listaTienda = this.currentDocument.lines.filter(x => x.typeArticle !== undefined);
      this.currentDocument.lines = listaTienda;
      
      this._copyTicket(this.currentDocument);
      this.ResetValue();
    } else {
      this._logHelper.trace('Se ha pulsado el boton volver');
      this.ResetValue();
    }
  }
   get defaultDateCopy(): Date {
    return new Date();
  }
  get documentSearchMode(): SearchDocumentMode {
    return SearchDocumentMode.Copy;
  }
  private _copyTicket(ticket: Document) {

    this.ProcesarPromos(ticket);

    // ticket.totalAmountWithTax = this.recalculateTicketAmount(ticket);

    this._documentCopyService.copySaleDocument(ticket).first().subscribe(
      success => {
        if (success) {
          this._statusBar.publishMessage(this.getLiteral('document_copy_component', 'message_StatusBar_Copy'));
          this._onCopySaleDocument.next(true);
        } else {
          this._statusBar.publishMessage(this.getLiteral('document_copy_component', 'error_StatusBar_NoCopyPrinted'));
        }
      },
      error => {
        this._logHelper.trace(error);
        this._statusBar.publishMessage(this.getLiteral('document_copy_component', 'error_StatusBar_NoCopyPrinted'));
      }
    );
  }


  ProcesarPromos(documento: Document) {

    documento.lines.forEach(linea => {
      if (linea.totalAmountWithTax < 0) {
         linea.priceWithTax = undefined;
      }

      if ((linea.originalPriceWithTax != undefined) && 
      (linea.appliedPromotionList != undefined) && 
      (linea.appliedPromotionList.length > 0)) {
        linea.totalAmountWithTax = linea.quantity > 1 ? linea.originalPriceWithTax * linea.quantity : linea.originalPriceWithTax;
      }
    });

  }


  ProcesarDocumento(documento: Document) {
    const listaAux: DocumentLine[] = [];
    const listaNeg: DocumentLine[] = [];
    const listaPos: DocumentLine[] = [];

    // código para eliminar las lineas de anulación de la vista
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

    if (documento.totalAmountWithTax < 0) {
      documento.lines = listaNeg;
    }
    else {
      documento.lines = listaAux;
    }

    // Ponemos el cambio con el valor correcto porque viene vacío y no calculado.
    if (documento.paymentDetails.length > 0) {
      documento.cambio = documento.paymentDetails[0].primaryCurrencyGivenAmount - documento.paymentDetails[0].primaryCurrencyTakenAmount;
    } else {
      const messageErrorLit = this.getLiteral('document_copy_component', 'Error_No_PaymentDetails');
      this._statusBar.publishMessage(messageErrorLit);
      throw new Error(messageErrorLit);
    }

    // Ponemos la matrícula para que se imprima en los tickets correspondientes.
    documento.customer.matricula = documento.plate;

    // Recalculamos el total amount ya que viene mal cuando hay promociones
    //documento.totalAmountWithTax = this.recalculateTicketAmount(documento);
  }

  recalculateTicketAmount(ticket: Document):number
  {
    let totalAmount = 0;
    ticket.lines.forEach(line=>{
      totalAmount += line.totalAmountWithTax;
    });

    return totalAmount;
  }

  getLiteral(group: string, key: string): string {
    return this._languageService.getLiteral(group, key);
  }

}
