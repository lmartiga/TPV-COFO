import { Component, OnInit, OnDestroy, HostBinding } from '@angular/core';
import { Subject } from 'rxjs/Subject';
import { Observable } from 'rxjs/Observable';
import { IActionFinalizable } from 'app/shared/iaction-finalizable';
import { Document } from 'app/shared/document/document';
import { DocumentSearchFilters } from 'app/shared/document-search/document-search-filters.enum';
import { StatusBarService } from 'app/services/status-bar/status-bar.service';
import { SearchDocumentMode } from 'app/shared/document-search/search-document-mode.enum';
import { DocumentSearchSelected } from 'app/shared/document-search/document-search-selected';
// import { DocumentSearchInternalService } from 'app/services/document/document-search-internal.service';
// import { GetDocumentResponseStatuses } from 'app/shared/web-api-responses/get-document-response-statuses.enum';
// import { FormatHelper } from 'app/helpers/format-helper';
import { DocumentLine } from 'app/shared/document/document-line';
import { ResponseStatus } from 'app/shared/response-status.enum';
import { PromotionsService } from 'app/services/promotions/promotions.service';
// tslint:disable-next-line:import-blacklist
import { Subscriber } from 'rxjs';
import { OPOSWriteDisplayResponseStatuses } from 'app/shared/hubble-pos-signalr-responses/opos-writedisplay-response-statuses.enum';
import { Globals } from 'app/services/Globals/Globals';
import { AppDataConfiguration } from 'app/config/app-data.config';
import { SignalROPOSService } from 'app/services/signalr/signalr-opos.service';
import { DocumentService } from 'app/services/document/document.service';
import { FuellingPointsAnulatedService } from 'app/services/fuelling-points/fuelling-points-anulated.service';
import { PaymentDetail } from 'app/shared/payments/payment-detail';
import { LanguageService } from 'app/services/language/language.service';
import { DocumentLinePromotion } from 'app/shared/document/document-line-promotion';
import { GenericHelper } from 'app/helpers/generic-helper';
import { LogHelper } from 'app/helpers/log-helper';

@Component({
  selector: 'tpv-copia',
  templateUrl: './document-copy-anulacion-parcial.component.html',
  styleUrls: ['./document-copy-anulacion-parcial.component.scss']
})
export class DocumentCopyAnulacionParcialComponent implements OnInit, OnDestroy, IActionFinalizable<boolean> {
  @HostBinding('class') class = 'tpv-document-copy';

  // private _onCopySaleDocument: Subject<boolean> = new Subject();
  private _CancelDocument: boolean = false;
  private _documentSearchFilters: Array<DocumentSearchFilters>;
  private _onCancelDocument: Subject<boolean> = new Subject();
  public currentDocument: Document;
  typeActionButton: number = 0;

  // indica el tipo de anulacion que se esta realizando
  tipoAnulacion: number = 0;
  // indica si el componente está anulando un ticket
  anulando:boolean;
  // propiedad que indica el numero de ticket a buscar
  txtNumTicket: string;
  // indica la fecha del ticket a buscar
  dateTicket: Date;
  // indica el importe del ticket a buscar
  ammount: number;
  // indica a la vista si mostrar el formulario de busqueda de ticket
  showForm = true;
  // indica si la busqueda no contiene ticket
  showError = false;
  // indica mensaje de error de validacion
  messageErrorList = {
    Ticket: {
      text: this.getLiteral('document_copyAnulacionParcial_component', 'error_enter_document'),
      show: false
    },
    Importe: {
      text: this.getLiteral('document_copyAnulacionParcial_component', 'error_enter_amount'),
      show: false
    },
    Fecha: {
      text: this.getLiteral('document_copyAnulacionParcial_component', 'error_enter_date'),
      show: false
    }
  };
  public mostrarPreView: boolean;
  errorText: string;
  messajeDocumentoGenerado: string = this.getLiteral('document_copyAnulacionParcial_component', 'literal_messageDocumentoGenerado');
  messajeDocumentoFacturado: string = this.getLiteral('document_copyAnulacionParcial_component', 'literal_messageDocumentoFacturado');
  messajeErrorDocumento: string = this.getLiteral('document_copyAnulacionParcial_component', 'literal_messageErrorDocumento');
  messajeErrorAnularDocumento: string = this.getLiteral('document_copyAnulacionParcial_component', 'literal_messageErrorAnularDocumento');
  messajeErrorObtenerSuministros: string = this.getLiteral('document_copyAnulacionParcial_component', 'literal_messageErrorObtenerSuministros');
  constructor(
    private _statusBar: StatusBarService,
    // private _docSearchSvc: DocumentSearchInternalService,
    private _promotionsSvc: PromotionsService,
    private _appDataConfig: AppDataConfiguration,
    private _signalROPOSService: SignalROPOSService,
    private _documentService: DocumentService,
    private _fuellingPointsSvc: FuellingPointsAnulatedService,
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
    this.anulando = false;
  }

  /**
   *Restauramos el documento para evitar que se mantengan mientras se carga otro.
   *
   * @memberof DocumentCopyComponent
   */
  ResetValue(): void {
    this.currentDocument = undefined;
    this.mostrarPreView = false;
  }

  ngOnDestroy() {
  }

  onFinish(): Observable<boolean> {
    return this._onCancelDocument.asObservable();
  }

  forceFinish(): void {
    this._onCancelDocument.next(false);
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

  getDocumentCopy(documento: Document) {

    this.currentDocument = documento;
    this.ProcesarDocumento(this.currentDocument);

    if (this.currentDocument.referencedDocumentIdList != undefined
      && this.currentDocument.referencedDocumentIdList.length > 0) {
      this.ProcesarPrepagosAnulados(this.currentDocument);
    }

  // Se añaden las promociones de forma correcta si tiene.
  let lineasTienda = this.currentDocument.lines.filter((item) => item.typeArticle.indexOf('TIEN') > 0);
  if(lineasTienda.length>0)
  {
    if (lineasTienda[0].appliedPromotionList != undefined && lineasTienda[0].appliedPromotionList.length > 0) {

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
            this.currentDocument.discountAmountWithTax = 0;
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
                    idCategoria: line.idCategoria,
                    nameCategoria: line.nameCategoria
                  });
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
    this.typeActionButtonDisable();

  }


  ProcesarPrepagosAnulados(documento: Document) {
    let sumTotal: number = 0;

    documento.lines.forEach(linea => {

      if (linea.typeArticle != undefined && linea.typeArticle.includes('COMBU')) {

        if (linea.businessSpecificLineInfo != undefined &&
          linea.businessSpecificLineInfo.supplyTransaction != undefined) {
          linea.quantity = linea.businessSpecificLineInfo.supplyTransaction.volume;
          linea.totalAmountWithTax = linea.businessSpecificLineInfo.supplyTransaction.money;
        }
        else {
          linea.quantity = 0;
          linea.totalAmountWithTax = 0;
        }

      }

      sumTotal += linea.totalAmountWithTax;
    });

    documento.totalAmountWithTax = sumTotal;
  }


  get defaultDateCopy(): Date {
    return new Date();
  }
  get documentSearchMode(): SearchDocumentMode {
    return SearchDocumentMode.Copy;
  }


  resetSearch() {
    this.mostrarPreView = false;
    this.txtNumTicket = '';
    this.dateTicket = undefined;
    this.ammount = undefined;
    this.messageErrorList.Fecha.show = false;
    this.messageErrorList.Importe.show = false;
    this.messageErrorList.Ticket.show = false;
    this.showError = false;
    this.ResetValue();
  }


  ProcesarDocumento(documento: Document) {
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

    documento.lines = listaAux;

    // Ponemos valores correctos a ciertos campos para la impresión posterior.
    documento.customer.matricula = documento.plate;
    documento.pendingAmountWithTax = 0;
    documento.cambio = 0;
  }

  onAnularTienda() {
    this.tipoAnulacion = 2;
    this.anulando = true;
    let listaTienda: Array<DocumentLine>;
    listaTienda = this.currentDocument.lines.filter(x => x.typeArticle !== undefined &&
      (x.typeArticle.includes('TIEN') || x.typeArticle.includes('SERV')));
    this.currentDocument.lines = listaTienda;
    this.metodosPagoAnulados();
    this.cancelDocumentTienda();
    
  }


  onAnularCombustible() {
    this.tipoAnulacion = 3;
    this.anulando = true;
    let listaCombustible: Array<DocumentLine>;
    listaCombustible = this.currentDocument.lines.filter(x => x.typeArticle !== undefined &&
      x.typeArticle.includes('COMBU'));
    this.currentDocument.lines = listaCombustible;
    this.metodosPagoAnulados();
    this.cancelDocument();
  }

  onAnulacionCompleta() {
    this.tipoAnulacion = 1;
    this.anulando = true;
    let listaTienda: Array<DocumentLine>;
    listaTienda = this.currentDocument.lines.filter(x => x.typeArticle !== undefined);
    this.currentDocument.lines = listaTienda;
      this.cancelDocument();
  }

  // Para mostrar un botón u otro: tienda 1, combustible 2, completo 3
  typeActionButtonDisable() {
    if (this.currentDocument.lines.length > 0) {
      if (this.currentDocument.lines.find(x => x.typeArticle.includes('TIEN')) == undefined
        && this.currentDocument.lines.find(x => x.typeArticle.includes('SERV')) == undefined) {
        this.typeActionButton = 2;
      } else if (this.currentDocument.lines.find(x => x.typeArticle.includes('COMBU')) == undefined) {
        this.typeActionButton = 1;
      } else {
        this.typeActionButton = 3;
      }
    }
  }

  metodosPagoAnulados() {
    let totalTicket: number = 0;
    let listaMetodosId: Array<String>;
    let lineaMetodo: Array<PaymentDetail> = new Array<PaymentDetail>();
    // Tarjeta, Otras Tarjetas, Efectivo, Contingencia, Resto Medios
    listaMetodosId = ['10', '16-65', '01', '71', 'RestoMedios'];
    const listaMetodosPago: Array<PaymentDetail> = new Array<PaymentDetail>();

    // Recalculo del total del ticket
    this.currentDocument.totalAmountWithTax = 0;
    totalTicket = 0;
    this.currentDocument.lines.forEach(line => { 
        if (line.appliedPromotionList != undefined && line.appliedPromotionList.length> 0)
        {
          let promotion = 0;

          line.appliedPromotionList.forEach(promo => {
            promotion +=promo.discountAmountWithTax;
          });
          totalTicket += (line.totalAmountWithTax - promotion);
        } else {
          totalTicket += (line.totalAmountWithTax);
        }
    });
    this.currentDocument.totalAmountWithTax = totalTicket;
    


    listaMetodosId.forEach(element => {
      if (totalTicket > 0) {
        if (element.includes('-')) {
          const values = element.split('-');
          const num1 = Number(values[0]);
          const num2 = Number(values[1]);

          lineaMetodo = this.currentDocument.paymentDetails.filter(x => Number(x.paymentMethodId.substring(5))
            >= num1 && Number(x.paymentMethodId.substring(5)) <= num2);
        }
        else if (element.includes('RestoMedios')) {
          const lineaMetodoAux: Array<PaymentDetail> = [];
          let yaIncluido: boolean = false;

          this.currentDocument.paymentDetails.forEach(pago => {
            yaIncluido = false;

            listaMetodosPago.forEach(metPago => {
              if (pago.paymentMethodId == metPago.paymentMethodId) {
                yaIncluido = true;
              }
            });

            if (yaIncluido == false) {
              lineaMetodoAux.push(pago);
            }
          });

          lineaMetodo = lineaMetodoAux;
        }
        else {
          lineaMetodo = this.currentDocument.paymentDetails.filter(x => Number(x.paymentMethodId.substring(5)) === Number(element));
        }

        if (lineaMetodo.length > 0) {
          lineaMetodo.forEach(element1 => {
            if (totalTicket < element1.primaryCurrencyTakenAmount) {
              element1.primaryCurrencyTakenAmount = totalTicket;
            }
            totalTicket = totalTicket - element1.primaryCurrencyTakenAmount;
            if (element1.primaryCurrencyTakenAmount > 0) {
              listaMetodosPago.push(element1);
            }
          });
        }
      }
    });

    this.currentDocument.paymentDetails = listaMetodosPago;
    // apaño para que aparezca el total del ticket de forma correcta
    this.currentDocument.totalAmountWithTax += this.currentDocument.discountAmountWithTax != null ? 
                    this.currentDocument.discountAmountWithTax : 0;
    
  }


  // talonsoc 14/10/19 - añadidos dos decimales cuando oel importe es entero
  private _btnWriteDisplayAnnulated() {
    this.OPOS_WriteDisplayAnnulated('Total', '-' +
       // this.currentDocument.totalAmountWithTax.toString() + ' ' + this._appDataConfig.baseCurrency.symbol)
       GenericHelper.ToStringWithDecimals(this.currentDocument.totalAmountWithTax) + ' ' + this._appDataConfig.baseCurrency.symbol)
      .first().subscribe(response => {
        if (response) {
          this._statusBar.publishMessage(this.getLiteral('document_copyAnulacionParcial_component', 'literal_messageSent'));
        } else {
          this._statusBar.publishMessage(this.getLiteral('document_copyAnulacionParcial_component', 'literal_notEstablish_communicationViewer'));
        }
      });
  }

  private OPOS_WriteDisplayAnnulated(strLinea1: string, strLinea2: string): Observable<boolean> {
    return Observable.create((observer: Subscriber<boolean>) => {
      Promise.resolve(this._signalROPOSService.OPOSWriteDisplay(strLinea1, strLinea2).then(responseOPOS => {
        if (responseOPOS.status === OPOSWriteDisplayResponseStatuses.successful) {
          observer.next(true);
        } else if (responseOPOS.status === OPOSWriteDisplayResponseStatuses.genericError) {
          observer.next(false);
        }
      }));
    });
  }

  isRequestingCancelOrCancelAndInvoiceDocument(): boolean {
    return this._CancelDocument;
  }

  cancelDocument() {
    if (this._CancelDocument === true) {
      return;
    }

    this._logHelper.trace('Se ha aceptado la anulación del documento:');
    this._logHelper.trace(this.currentDocument);

    let SumiSinSubir: boolean = false;

    // Validación sobre Tickets con Suministros
    // Si el artículo/producto es un Combustible y no se obtiene supplyTransaction, no se debe permitir continuar
    this.currentDocument.lines.forEach(line => {
      if (SumiSinSubir == false && line.typeArticle != undefined && line.typeArticle.includes('COMBU') && line.businessSpecificLineInfo.supplyTransaction == undefined) {
        this._onCancelDocument.next(false);
        this._statusBar.publishMessage(this.messajeErrorObtenerSuministros);
        SumiSinSubir = true;
      }
    });

    // Si no se ha subido el suministro aún a plataforma nos salimos tras el mensaje.
    if (SumiSinSubir) {
      return;
    }
    // Eliminamos las lineas del ticket que correspondan a productos cancelados en el ticket original.
    // Y ponemos valores correctos a ciertos campos para la impresión posterior.
    this.ProcesarDocumento(this.currentDocument);

    this._btnWriteDisplayAnnulated();

    if (this.currentDocument.Nfactura != undefined && this.tipoAnulacion != 3) {
      this._documentService.generarFacturaAnulada(this.currentDocument, this.tipoAnulacion)
    }

    this._CancelDocument = true;
    this._documentService.cancelDocumentCOFO(this.currentDocument)
      .first()
      .subscribe(
        success => {
          this._CancelDocument = false;
          if (success) {
            setTimeout(() => {
              this._statusBar.resetProgress();
              this._statusBar.publishMessage(this.messajeDocumentoGenerado);
              // Cargamos los suministros anulados.
              this._fuellingPointsSvc.GetAllSuppliesAnulatedByShop()
                .first().subscribe(response => {
                  Globals.Delete();
                  if (response != undefined && response.length > 0) {
                    response.forEach(x => {
                      const point = Globals.Get().find(s => s.id === x.fuellingPointId);

                      if (point !== undefined && point !== null) {
                        Globals.Put(x.fuellingPointId, true);
                      } else {
                        Globals.Set(x.fuellingPointId, true);
                      }
                    });
                  }
                });

            }, 3000);            
            this._onCancelDocument.next(true);
          } else {
            this._onCancelDocument.next(false);
            this._statusBar.publishMessage(this.messajeErrorDocumento);
          }
          this.anulando = false;
          this.ResetValue();
        },
        error => {
          this.anulando = false;
          this.ResetValue();
          this._CancelDocument = false;
          this._logHelper.trace(error);
          this._onCancelDocument.next(false);
          this._statusBar.publishMessage(this.messajeErrorAnularDocumento);
        });
  }

  cancelDocumentTienda() {
    if (this._CancelDocument === true) {
      return;
    }

    this._logHelper.trace('Se ha aceptado la anulación del documento:');
    this._logHelper.trace(this.currentDocument);

    // Eliminamos las lineas del ticket que correspondan a productos cancelados en el ticket original.
    // Y ponemos valores correctos a ciertos campos para la impresión posterior.
    this.ProcesarDocumento(this.currentDocument);

    this._btnWriteDisplayAnnulated();

    if (this.currentDocument.Nfactura != undefined) {
      this._documentService.generarFacturaAnulada(this.currentDocument, this.tipoAnulacion)
    }

    this._CancelDocument = true;
    this._documentService.cancelDocumentCOFO(this.currentDocument)
      .first()
      .subscribe(
        success => {
          this._CancelDocument = false;
          if (success) {
            setTimeout(() => {
              this._statusBar.resetProgress();
              this._statusBar.publishMessage(this.messajeDocumentoGenerado);
            }, 3000);
            this._onCancelDocument.next(true);
          } else {
            this._onCancelDocument.next(false);
            this._statusBar.publishMessage(this.messajeErrorDocumento);
          }
          this.anulando = false;
          this.ResetValue();
        },
        error => {
          this.anulando = false;
          this.ResetValue();
          this._CancelDocument = false;
          this._logHelper.trace(error);
          this._onCancelDocument.next(false);
          this._statusBar.publishMessage(this.messajeErrorAnularDocumento);
        });
  }

  getLiteral(group: string, key: string): string {
    return this._languageService.getLiteral(group, key);
  }

}
