import { Component, OnInit, OnDestroy, HostBinding } from '@angular/core';
import {
  DocumentCancellationParcialService
 } from '../document-cancellation-parcialService/document-cancellation-parcial.service';

import { Document } from 'app/shared/document/document';

import { IActionFinalizable } from '../../../shared/iaction-finalizable';
import { Subject } from 'rxjs/Subject';
import { ISubscription } from 'rxjs/Subscription';
import { AppDataConfiguration } from '../../../config/app-data.config';
import { GetDocumentResponseStatuses } from '../../../shared/web-api-responses/get-document-response-statuses.enum';
import { FormatHelper } from '../../../helpers/format-helper';
import { StatusBarService } from '../../../services/status-bar/status-bar.service';
import { DocumentLine } from '../../../shared/document/document-line';
import { LogHelper } from 'app/helpers/log-helper';

@Component({
  selector: 'tpv-anular-parcial',
  templateUrl: './document-cancellation-parcial.component.html',
  styleUrls: ['./document-cancellation-parcial.component.scss']
})
export class DocumentCancellationParcialComponent implements OnInit, OnDestroy, IActionFinalizable<boolean> {
  @HostBinding('class') class = 'tpv-cancel-parcial-document';

  private _getTickets: Subject<boolean> = new Subject();
  private tipo: string;
  listaDocumentos: Array <Document>;
  documentoAnular: Document;
  lines: DocumentLine;
  documentoAnulado: Document;
  linesAnul: Array<DocumentLine> = [];
  lineNumber: number = 0;
  referencias: Array <string>;
  private documentoRecorrer: Document;
  private _getListDocumentSubscription: ISubscription;
  private _searchingTicket: boolean = false;
  currentTicket: Document;

  // propiedad que indica el numero de ticket a buscar
  txtNumTicket: string;
  // indica la fecha del ticket a buscar
  dateTicketDesde: Date;
  // indica la fecha del ticket a buscar
  dateTicketHasta: Date;
  // indica el importe del ticket a buscar
  ammountDesde: number;
  // indica el importe del ticket a buscar
  ammountHasta: number;
  // indica a la vista si mostrar el formulario de busqueda de ticket
  showForm = true;
  // indica si la busqueda no contiene ticket
  showError = false;
  // indica mensaje de error de validacion
  messageErrorList = {
    Ticket: {
      text: 'Debe introducir el número de documento',
      show: false
    },
    Importe: {
      text: 'Debe introducir el importe',
      show: false
    },
    Fecha: {
      text: 'Debe introducir fecha',
      show: false
    }
  };
  errorText: string;

  constructor(
    private _documentAnullatedParcial: DocumentCancellationParcialService,
    private _appDataConfig: AppDataConfiguration,
    private _statusBar: StatusBarService,
    private  _logHelper: LogHelper
  ) {
  }

  ngOnInit() {
    // llamada a WS para cargar los tickets.
    this.searchDocumentsToAnulled();
  }

  onFinish() {
    return this._getTickets.asObservable();
  }

  forceFinish(): void {
    this._getTickets.next(false);
  }

  ngOnDestroy() {
    this._getListDocumentSubscription.unsubscribe();
  }

  isSearchingTicket(): boolean {
    return this._searchingTicket;
  }

  private searchDocumentsToAnulled() {
    this._logHelper.trace('Entra en searchDocumentsToAnulled');
    if (this._searchingTicket === true) {
      return;
    }
    this.showError = false;
    this._getListDocumentSubscription =
      this._documentAnullatedParcial.SearchDocumentsToAnulled(this.dateTicketDesde, this.dateTicketHasta, this.ammountDesde, this.ammountHasta)
      .first()
      .subscribe(result => {
        if (result != undefined && result.documentList.length > 0) {
          this.listaDocumentos = result.documentList;
        } else {
            // reportar resultado negativo al llamante
            this.forceFinish();
        }
      });
  }

  searchTicket() {
    const idDocumento: string = this._appDataConfig.company.id + this.txtNumTicket;

    this._documentAnullatedParcial.getDocument(idDocumento)
      .first()
      .subscribe(docResponse => {
        this._searchingTicket = false;
        if (docResponse == undefined || docResponse.status != GetDocumentResponseStatuses.Successful) {
          if (docResponse.status == GetDocumentResponseStatuses.DocumentNotExists) {
            this.errorText = 'Documento no encontrado';
            this.showError = true;
            return;
          }
          this._logHelper.trace('Error recuperando documento');
          this.errorText = 'Error buscando documento';
          this._logHelper.trace(docResponse.message);
          if (FormatHelper.formatGetDocumentResponseStatusesMessage(docResponse.status) !== 'Se ha producido un error.') {
            this._statusBar.publishMessage(FormatHelper.formatGetDocumentResponseStatusesMessage(docResponse.status));
          }
          this.showError = true;
          return;
        }
        const document = docResponse.document;
        this.documentoAnular = docResponse.document;
        if (document == undefined) {
          this.errorText = 'El documento encontrado no es valido';
          this.showError = true;
          return;
        }
        if (document.totalAmountWithTax < 0 ) {
          this.errorText = 'El documento es una anulación y no puede ser anulado';
          this.showError = true;
          return;
        }
        if (document.referencedDocumentIdList.length > 0 ) {
          this.errorText = 'El documento ya esta anulado';
          this.showError = true;
          return;
        }
      });
  }

  cancelDocument(event: any) {
    // Asignamos el tipo de anulacion
    this.tipo = event.srcElement.name;
    // Buscamos el ticket a anular
    this.searchTicket();

    // Traemos las referencias que deben estar en el ticket anulado
    this.traerReferencias(this.tipo);

    // Limpiamos las lineas del documento de acuerdo a la lista de referencias
    this.limpiarDocument(this.referencias);

    // Hacemos un recalculo de los totales del ticket
    this.recalcularTotales();

    // Hacemos un recalculo de la lista de los medios de pago
    this.recalcularMedioPago();

    // Anulamos el documento
    this.anularDocumento();
  }

  traerReferencias(tipo: string) {
    this._logHelper.trace('Entra en traerReferencias');
    this.showError = false;

    this._searchingTicket = true;
    this._getListDocumentSubscription =
      this._documentAnullatedParcial.SearchDocumentsToAnulled(this.dateTicketDesde, this.dateTicketHasta, this.ammountDesde, this.ammountHasta)
      .first()
      .subscribe(result => {
        if (result != undefined && result.documentList.length > 0) {
          this.listaDocumentos = result.documentList;
        } else {
            // reportar resultado negativo al llamante
            this.forceFinish();
        }
      });
  }

  limpiarDocument(referencias: Array <string>) {
    // Clonamos el documento
    this.documentoRecorrer = Object.assign(this.documentoAnular , Document);

    this.documentoRecorrer.lines.forEach(t => {

      if (referencias.indexOf(t.productId) == -1) {
          this.documentoAnular.lines.splice(this.lineNumber);
      }

      this.lineNumber += 1;
    });

  }

  recalcularTotales() {
    this.documentoAnular.totalAmountWithTax = 0;
    this.documentoAnular.lines.forEach(line => this.documentoAnular.totalAmountWithTax += (line.totalAmountWithTax - line.discountAmountWithTax));
  }

  recalcularMedioPago() {}

  anularDocumento() {
    this.linesAnul = new Array<DocumentLine>();

    this.documentoAnular.lines.forEach(t => {
        this.linesAnul.push(this.lines = {
          description: t.description,
          discountPercentage: t.discountPercentage,
          // tslint:disable-next-line:max-line-length
          totalAmountWithTax: t.totalAmountWithTax - t.totalAmountWithTax * 2,
          productId: t.productId,
          appliedPromotionList: t.appliedPromotionList,
          taxAmount: t.taxAmount,
          priceWithoutTax: t.priceWithoutTax,
          quantity: t.quantity * -1,
          priceWithTax: t.priceWithTax,
          taxPercentage: t.taxPercentage,
          discountAmountWithTax: t.discountAmountWithTax,
          idCategoria: '',
          nameCategoria: ''
        });
    });

    this.documentoAnulado.lines = this.linesAnul;

  }

  radioChangeHandler (event: any) {
    this.txtNumTicket = event.target.value;
  }
}
