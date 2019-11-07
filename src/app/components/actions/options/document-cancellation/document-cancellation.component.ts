import { Component, OnInit, OnDestroy, HostBinding } from '@angular/core';
import { Subject } from 'rxjs/Subject';
import { Observable } from 'rxjs/Observable';
import { IActionFinalizable } from 'app/shared/iaction-finalizable';

import { DocumentService } from 'app/services/document/document.service';
import { StatusBarService } from 'app/services/status-bar/status-bar.service';
import { Document } from 'app/shared/document/document';
import { FormatHelper } from 'app/helpers/format-helper';
import { DocumentSearchInternalService } from 'app/services/document/document-search-internal.service';
import { GetDocumentResponseStatuses } from 'app/shared/web-api-responses/get-document-response-statuses.enum';
import { AppDataConfiguration } from 'app/config/app-data.config';
import { SearchDocumentMode } from 'app/shared/document-search/search-document-mode.enum';
import { Globals } from 'app/services/Globals/Globals';
import { FuellingPointsAnulatedService } from 'app/services/fuelling-points/fuelling-points-anulated.service';
import { SignalROPOSService } from 'app/services/signalr/signalr-opos.service';
import { OPOSWriteDisplayResponseStatuses } from 'app/shared/hubble-pos-signalr-responses/opos-writedisplay-response-statuses.enum';
import { Subscriber } from 'rxjs/Subscriber';
import { DocumentLine } from 'app/shared/document/document-line';
import { LanguageService } from 'app/services/language/language.service';
import { GenericHelper } from 'app/helpers/generic-helper';
import { LogHelper } from 'app/helpers/log-helper';

@Component({
  selector: 'tpv-anular',
  templateUrl: './document-cancellation.component.html',
  styleUrls: ['./document-cancellation.component.scss']
})
export class DocumentCancellationComponent implements OnInit, OnDestroy, IActionFinalizable<boolean> {
  @HostBinding('class') class = 'tpv-cancel-document';

  private _onCancelDocument: Subject<boolean> = new Subject();
  private _CancelDocument: boolean = false;
  private _searchingTicket: boolean = false;
  currentTicket: Document;

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
      text: '', // 'Debe introducir el número de documento',
      show: false
    },
    Importe: {
      text: '', // 'Debe introducir el importe',
      show: false
    },
    Fecha: {
      text: '', // 'Debe introducir fecha',
      show: false
    }
  };
  errorText: string;
  messajeDocumentoGenerado: string = ''; // 'Documento anulado correctamente';
  messajeDocumentoFacturado: string = ''; // 'No se puede Anular Documentos Facturados';
  messajeErrorDocumento: string = ''; // 'Error al anular el documento';
  messajeErrorAnularDocumento: string = ''; // 'No se pudo anular el documento';
  messajeErrorObtenerSuministros: string = ''; // 'No se ha sincronizado los datos del suministro, inténtelo más tarde.';

  constructor(
    private _documentService: DocumentService,
    private _fuellingPointsSvc: FuellingPointsAnulatedService,
    private _statusBar: StatusBarService,
    private _docSearchSvc: DocumentSearchInternalService,
    private _appDataConfig: AppDataConfiguration,
    private _signalROPOSService: SignalROPOSService,
    private _languageService: LanguageService,
    private  _logHelper: LogHelper
  ) {
    this.messageErrorList = {
      Ticket: {
        // 'Debe introducir el número de documento'
        text: this.getLiteral('document_cancellation_component', 'validation_DocumentCancellation_DocumentNumberRequired'),
        show: false
      },
      Importe: {
        // 'Debe introducir el importe'
        text: this.getLiteral('document_cancellation_component', 'validation_DocumentCancellation_AmountRequired'),
        show: false
      },
      Fecha: {
        // 'Debe introducir fecha',
        text: this.getLiteral('document_cancellation_component', 'validation_DocumentCancellation_DocumentDateRequired'),
        show: false
      }
    };

    // 'Documento anulado correctamente';
    this.messajeDocumentoGenerado = this.getLiteral('document_cancellation_component', 'message_DocumentCancellation_DocumentCancelledSuccessfully'),
      // 'No se puede Anular Documentos Facturados';
      this.messajeDocumentoFacturado = this.getLiteral('document_cancellation_component', 'message_DocumentCancellation_UnableCancelBilledDocuments'),
      // 'Error al anular el documento';
      this.messajeErrorDocumento = this.getLiteral('document_cancellation_component', 'error_DocumentCancellation_ErrorWhileCancelling'),
      // 'No se pudo anular el documento';
      this.messajeErrorAnularDocumento = this.getLiteral('document_cancellation_component', 'error_DocumentCancellation_ReverseCouldNotBeFinished'),
      // 'No se ha sincronizado los datos del suministro, inténtelo más tarde.';
      this.messajeErrorObtenerSuministros = this.getLiteral('document_cancellation_component', 'message_DocumentCancellation_SuministSynchronized');
  }

  ngOnInit() {
  }

  ngOnDestroy() {
  }

  onFinish(): Observable<boolean> {
    return this._onCancelDocument.asObservable();
  }

  forceFinish(): void {
    this._onCancelDocument.next(false);
  }

  isSearchingTicket(): boolean {
    return false;
  }
  searchTicket() {
    if (this._searchingTicket === true) {
      return;
    }
    this.showError = false;
    this.messageErrorList.Fecha.show = this.dateTicket == undefined;
    this.messageErrorList.Ticket.show = this.txtNumTicket == undefined || this.txtNumTicket.trim() == '';
    this.messageErrorList.Importe.show = this.ammount == undefined || this.ammount.toString().trim() == '';
    if (this.messageErrorList.Fecha.show || this.messageErrorList.Ticket.show || this.messageErrorList.Importe.show) {
      // TODO mostrar mandatory
      return;
    }

    this.txtNumTicket = this.txtNumTicket.trim();

    this._searchingTicket = true;
    // search Ticket and show preview
    // montamos el idDocument como NCompany + numDocumento
    const idDocumento: string = this._appDataConfig.company.id + this.txtNumTicket;
    this._docSearchSvc.getDocument(idDocumento, SearchDocumentMode.Cancel)
      .first()
      .subscribe(docResponse => {
        this._searchingTicket = false;
        if (docResponse == undefined || docResponse.status != GetDocumentResponseStatuses.Successful) {
          if (docResponse.status == GetDocumentResponseStatuses.DocumentNotExists) {
            // this.errorText = 'Documento no encontrado';
            this.errorText = this.getLiteral('document_cancellation_component', 'error_DocumentCancellation_DocumentNotFound');
            this.showError = true;
            return;
          }
          this._logHelper.trace('Error recuperando documento');
          // this.errorText = 'Error buscando documento';
          this.errorText = this.getLiteral('document_cancellation_component', 'error_DocumentCancellation_SearchingError');
          this._logHelper.trace(docResponse.message);
          if (FormatHelper.formatGetDocumentResponseStatusesMessage(docResponse.status) !== 'Se ha producido un error.') {
            this._statusBar.publishMessage(FormatHelper.formatGetDocumentResponseStatusesMessage(docResponse.status));
          }
          this.showError = true;
          return;
        }
        const document = docResponse.document;
        if (document == undefined) {
          // this.errorText = 'El documento encontrado no es valido';
          this.errorText = this.getLiteral('document_cancellation_component', 'error_DocumentCancellation_DocumentNotValid');
          this.showError = true;
          return;
        }
        if (document.totalAmountWithTax < 0) {
          // this.errorText = 'El documento es una anulación y no puede ser anulado';
          this.errorText = this.getLiteral('document_cancellation_component', 'error_DocumentCancellation_DocumentIsAnReversal');
          this.showError = true;
          return;
        }
        if (document.referencedDocumentIdList.length > 0) {
          // this.errorText = 'El documento ya esta anulado';
          this.errorText = this.getLiteral('document_cancellation_component', 'error_DocumentCancellation_Documentallreadyannul');
          this.showError = true;
          return;
        }
        const isSameDate = (this.dateTicket.getDate() == document.emissionLocalDateTime.getDate()
          && (this.dateTicket.getMonth() == document.emissionLocalDateTime.getMonth())
          && (this.dateTicket.getFullYear() == document.emissionLocalDateTime.getFullYear()));
        const isSameAmount = (this.ammount == document.totalAmountWithTax);
        if (isSameDate && isSameAmount) {
          this.currentTicket = document;
          this.showForm = false;
        } else {
          this.errorText = '';
          if (!isSameDate) {
            // documento existe pero no coincide la fecha
            // this.errorText = 'La fecha no coincide con el documento.\n';
            this.errorText = this.getLiteral('document_cancellation_component', 'error_DocumentCancellation_DateDoesNotMatch');
          }
          if (!isSameAmount) {
            // documento existe pero no coincide importe
            // this.errorText = this.errorText.concat('El importe no coincide con el documento.');
            // tslint:disable-next-line:max-line-length
            this.errorText = this.errorText.concat(this.getLiteral('document_cancellation_component', 'error_DocumentCancellation_AmountDoesNotMatch'));
          }
          this.showError = true;
        }
      });
  }

  isRequestingCancelOrCancelAndInvoiceDocument(): boolean {
    return this._CancelDocument;
  }
  cancelDocument() {
    if (this._CancelDocument === true) {
      return;
    }
    // Validacion Documentos Anulados
    if (this.currentTicket.Nfactura != undefined) {
      this._onCancelDocument.next(false);
      this._statusBar.publishMessage(this.messajeDocumentoFacturado);
      return;
    }

    let SumiSinSubir: boolean = false;

    // Validación sobre Tickets con Suministros
    // Si el artículo/producto es un Combustible y no se obtiene supplyTransaction, no se debe permitir continuar
    this.currentTicket.lines.forEach(line => {
      if (SumiSinSubir == false && line.typeArticle !== undefined && line.typeArticle.includes('COMBU')
        && line.businessSpecificLineInfo.supplyTransaction == undefined) {
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
    this.ProcesarDocumento(this.currentTicket);

    this._btnWriteDisplayAnnulated();
    this._CancelDocument = true;
    this._documentService.cancelDocumentCOFO(this.currentTicket)
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
        },
        error => {
          this._CancelDocument = false;
          this._logHelper.trace(error);
          this._onCancelDocument.next(false);
          this._statusBar.publishMessage(this.messajeErrorAnularDocumento);
        });
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
    documento.pendingAmountWithTax = 0;
    documento.cambio = 0;
  }

  resetSearch() {
    this.showForm = true;
    this.txtNumTicket = '';
    this.dateTicket = undefined;
    this.ammount = undefined;
    this.messageErrorList.Fecha.show = false;
    this.messageErrorList.Importe.show = false;
    this.messageErrorList.Ticket.show = false;
    this.showError = false;
  }

  // talonsoc 14/10/19 - añadidos dos decimales cuando el importe es entero
  private _btnWriteDisplayAnnulated() {
    this.OPOS_WriteDisplayAnnulated('Total',
      // '-' + this.currentTicket.totalAmountWithTax.toString() + ' ' + this._appDataConfig.baseCurrency.symbol)
      '-' + GenericHelper.ToStringWithDecimals(this.currentTicket.totalAmountWithTax) + ' ' + this._appDataConfig.baseCurrency.symbol)
      .first().subscribe(response => {
        /*if (response) {
          this._statusBar.publishMessage('mensaje enviado');
        } else {
          this._statusBar.publishMessage('no se ha podido establecer comunicacion con el visor');
        }*/
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

  getLiteral(group: string, key: string): string {
    return this._languageService.getLiteral(group, key);
  }

}
