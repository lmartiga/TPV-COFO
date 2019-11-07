import { Component, HostBinding, OnInit, Input } from '@angular/core';
import { DocumentSearchFilters } from 'app/shared/document-search/document-search-filters.enum';
import { Subject } from 'rxjs/Subject';
import { Observable } from 'rxjs/observable';
import { DocumentSearch } from 'app/shared/document-search/document-search';
import { SearchDocumentMode } from 'app/shared/document-search/search-document-mode.enum';
// import { DocumentService } from 'app/services/document/document.service';
import { StatusBarService } from 'app/services/status-bar/status-bar.service';
import { DocumentService } from 'app/services/document/document.service';
import { DocumentSearchInternalService } from 'app/services/document/document-search-internal.service';
import { Document } from 'app/shared/document/document';
import { ListDocumentResponse } from 'app/shared/web-api-responses/ListDocumentResponse';
import { InformeVentasResumen } from 'app/shared/document/InformeVentasResumen';
import { AppDataConfiguration } from 'app/config/app-data.config';
import { InformeVentasRecaudacion } from 'app/shared/document/InformeVentasRecaudacion';
import { ListaMediosPago } from 'app/shared/document/ListaMediosPago';
import { Categorias } from 'app/shared/web-api-responses/Categorias';
import { GetCategoriasResponse } from 'app/shared/web-api-responses/GetCategoriasResponse';
import { InformeVentasCategorias } from 'app/shared/document/InformeVentasCategorias';
import { LineListVentasCategorias } from 'app/shared/document/LineListVentasCategorias';
import { MdButtonToggle } from '@angular/material';
import { TotalGridRecaudacionObj } from 'app/shared/document/TotalGridRecaudacionObj';
import { LogHelper } from 'app/helpers/log-helper';



@Component({
  selector: 'tpv-informe-ventas',
  templateUrl: './informe-ventas.component.html',
  styleUrls: ['./informe-ventas.component.scss']
})
export class InformeVentasComponent implements OnInit {
  @HostBinding('class') class = 'tpv-informe-ventas';
  @Input() documentSearchFilters: Array<DocumentSearchFilters>;
  @Input() fromDate: Date;

  documentosOrigen: ListDocumentResponse;
  categoriasInf: GetCategoriasResponse;
  searchMode: SearchDocumentMode;
  radioButtonSelected: string = 'Resumen ventas'; // POR DEFECTO
  timeFrom: string;
  timeTo: string;
  radioButtonsGroup: string[] = ['Resumen ventas', 'Detalle ventas'];
  documentList: Document[];
  categoriaList: Categorias[] = [];
  categoriaSelect: any;
  mostrarMultiSelect: boolean = false;
  buttonImprimirBool: boolean = true;

  categoriaList2 = [{ codigo: 'Prueba 1', nombre: 'Prueba 2' }];

  documentListVentas: InformeVentasResumen[];
  listaCabeceraMediosPago: String[];
  documentListRecaudacion: InformeVentasRecaudacion[];
  listaAPintarCategorias: InformeVentasCategorias[];
  dateCategoriasTotal: Date = undefined;

  private _onInformeDocument: Subject<ListDocumentResponse> = new Subject();
  private _onInformeCategoria: Subject<GetCategoriasResponse> = new Subject();
  private _informeVentas: Subject<boolean> = new Subject();

  // para poder acceder a enumerado desde la UI
  documentSearchFiltersEnum = DocumentSearchFilters;
  // abrir y cerrar el panel de filtros
  filterPanelOpened: boolean;
  textFilters: string = '';
  TotalGridRecaudacion: TotalGridRecaudacionObj = { Tienda : 0, Carburante : 0, Servicios : 0};
  fromEmissionDate: Date;
  toEmissionDate: Date;

  constructor(
    private _documentSearchInternal: DocumentSearchInternalService,
    private _documentService: DocumentService,
    private _appDataConfig: AppDataConfiguration,
    private _statusBar: StatusBarService,
    private  _logHelper: LogHelper
  ) {

  }

  ngOnInit() {

    this.filterPanelOpened = false; // TODO ver si esto es asi

    if (this.fromDate != undefined) {
      this.fromEmissionDate = this.fromDate;
      // this.searchDocuments();
      this.textFilters = 'Documentos recientes.';
    } else {
      this.defaultDateCopy();
    }

    this.radioButtonSelected = this.radioButtonsGroup[0];

    // Cargamos el filtro de categorias
    this.syncCategoriasReplica();


    this.searchDocumentsInforme();

  }

  syncCategoriasReplica() {
    this._documentSearchInternal.syncCategoriasInformeVentas()
      .first()
      .subscribe(
        success => {
          if (success) {
            this.categoriaList = success.CategoriasList;
            this.categoriaList.push({ codigo: '-4', nombre: 'Tienda' });
            this.categoriaList.push({ codigo: '-2', nombre: 'Carburante' });
            this.categoriaList.push({ codigo: '-3', nombre: 'Servicio' });
            this._onInformeCategoria.next(success);
          } else {

            this.categoriaList = [];
            this._onInformeCategoria.next(success);
            // this.textFilters = 'No se han encontrado documentos.';
            // this._statusBar.publishMessage('No se han encontrado documentos.');
          }
        },
        error => {
          this._logHelper.trace(error);
          this.categoriaList = [];
          // tslint:disable-next-line:prefer-const
          let responseF: GetCategoriasResponse;
          this._onInformeCategoria.next(responseF);
          // this._statusBar.publishMessage('Error al buscar documentos.');
        });
  }

  forceFinish(): void {
    this._informeVentas.next(false);
  }

  onFinish(): Observable<boolean> {
    return this._informeVentas.asObservable();
  }


  // FUNCIONES EXT

  private defaultDateCopy() {
    this.fromEmissionDate = new Date();
  }

  radioChangeHandler(event: any) {
    if (event.target.value == 'Detalle ventas') {
      this.mostrarMultiSelect = true;
      this.categoriaSelect = [];
      this.documentListRecaudacion = [];
      this.documentListVentas = [];
      this.TotalGridRecaudacion = { Tienda : 0, Carburante : 0 , Servicios : 0};
    } else {
      this.mostrarMultiSelect = false;
      this.categoriaSelect = [];
      this.listaAPintarCategorias = [];
    }
    this.buttonImprimirBool = true;
    this.radioButtonSelected = event.target.value;
  }

  inputTimeToChangeHandler(event: any) {
    this.timeFrom = event.target.value;
  }

  inputTimeFromChangeHandler(event: any) {
    this.timeTo = event.target.value;
  }

  searchDocumentsInforme() {
    this.fromEmissionDate == undefined ? this.fromEmissionDate = new Date() : this.fromEmissionDate = this.fromEmissionDate;
    this._logHelper.trace('Se ha pulsado el boton Aceptar');
    this._logHelper.trace('Generando informe....');

    this.listaAPintarCategorias = [];
    this.documentListVentas = [];
    this.TotalGridRecaudacion = { Tienda : 0, Carburante : 0 , Servicios : 0};
    this.documentListRecaudacion = [];

    if (((this.fromEmissionDate == undefined || this.fromEmissionDate.toString() == '')
      || (this.toEmissionDate == undefined || this.toEmissionDate.toString() == ''))
      && ((this.timeTo == undefined || this.timeTo.toString() == '')
        || (this.timeFrom == undefined || this.timeFrom.toString() == ''))
      && (this.radioButtonSelected == undefined || this.radioButtonSelected.toString() == '')
    ) { return; }

    (this.timeFrom == undefined || this.timeFrom.toString() == '') ?
      this.fromEmissionDate.setHours(0, 0, 0, 0) : this.fromEmissionDate.setHours(+this.timeFrom.substring(0, 2),
        +this.timeFrom.substring(3, 5), 0, 0);
    if (this.toEmissionDate !== undefined) {
      (this.timeTo == undefined || this.timeTo.toString() == '') ?
        this.toEmissionDate.setHours(23, 59, 59, 0) : this.toEmissionDate.setHours(+this.timeTo.substring(0, 2), +this.timeTo.substring(3, 5), 0, 0);
    }
    // CONCATENAMOS LOS MINUTOS
    // this.concatDateTime();

    // VALIDAMOS LAS FECHAS
    if (!this._validateDates()) {
      // this._statusBar.publishMessage('Filtro de fecha incorrecto');
      return;
    }

    const documentSearchData: DocumentSearch = {
      searchMode: SearchDocumentMode.Default,
      document: undefined,
      fromEmissionDate: this.fromEmissionDate,
      toEmissionDate: this.toEmissionDate,
      plate: undefined,
      customerId: undefined,
      operator: undefined,
      fromImport: undefined,
      toImport: undefined
    };

    this._documentSearchInternal.searchDocumentsInformeVentas(documentSearchData)
      .first()
      .subscribe(
        success => {
          if (success) {
            this.documentList = success.ListDocument;
            this._onInformeDocument.next(success);
            this.filterPanelOpened = false;
            this._rellenarTablasInforme();
            // this.buttonImprimirBool = true;
            this._statusBar.publishMessage('Documentos recuperados correctamente.');
          } else {

            this.documentList = [];
            this._onInformeDocument.next(success);
            // this.textFilters = 'No se han encontrado documentos.';
            this._statusBar.publishMessage('No se han encontrado documentos.');
            // this._statusBar.publishMessage(this.messajeErrorDocumento);
          }
        },
        error => {
          this._logHelper.trace(error);
          this.documentList = [];
          // tslint:disable-next-line:prefer-const
          let documentoF: Document;
          // tslint:disable-next-line:prefer-const
          let responseF: ListDocumentResponse;
          responseF.ListDocument.push(documentoF);
          this._onInformeDocument.next(responseF);
          // this.textFilters = 'No se han encontrado documentos.';
          this._statusBar.publishMessage('No se han encontrado documentos.');
          // this._statusBar.publishMessage(this.messajeErrorAnularDocumento);
        });
  }

  // private concatDateTime() {
  //   if (this.toEmissionDate == undefined || this.fromEmissionDate.toString() == '' ) {
  //     if (this.timeTo == undefined || this.timeTo.toString() == '') {

  //     }
  //   }
  // }


  private _rellenarTablasInforme() {

    this.documentListVentas = [];
    this.TotalGridRecaudacion = { Tienda : 0, Carburante : 0 , Servicios : 0};
    // tslint:disable-next-line:prefer-const
    let listaAFormatear: InformeVentasResumen[] = [];
    let categoriaABuscar: string[];
    let listaCategoriasDetalles: string[];
    let listaAPintar: InformeVentasCategorias[] = [];
    let totalDeudas: any[];
    // VARIABLES
    let totalTiendaDia = 0;
    let totalCarburanteDia = 0;
    let totalServiciosDia = 0;
    this.listaCabeceraMediosPago = [];
    // tslint:disable-next-line:prefer-const
    let listaCabeceraFormat: string[] = [];
    // tslint:disable-next-line:prefer-const
    let listaAFormatearRe: InformeVentasRecaudacion[] = [];
    let totalMedioPago = 0;
    let MedioPagoAdd: ListaMediosPago = { CodigoMedio: '', Nombre: '', Importe: 0 };
    let informesAdd: InformeVentasRecaudacion;
    let deudaAdd: InformeVentasRecaudacion;

    categoriaABuscar = [];
    // let categoriaBusq: string[];
    // filtramos las categorias
    if (this.categoriaSelect == undefined || this.categoriaSelect.length == 0 || this.categoriaSelect.indexOf('allCategorias') > -1) {
      this.categoriaSelect = this.categoriaList.map(x => {
        return x.codigo;
      });
    }
    categoriaABuscar = this.categoriaSelect;


    // Diferenciamos entre Resumen ventas y detalles ventas

    if (this.radioButtonSelected.includes(this.radioButtonsGroup[0])) { // Resumen Ventas

      // tabla resumen de ventas
      // Lista de dias
      // let fechasTab: Date[];
      // Reiniciamos las fechas
      this.documentList.forEach(elemento => {
        elemento.emissionUTCDateTime.setHours(0, 0, 0, 0);
      });

      this.documentList.forEach(element => {
        totalTiendaDia = 0;
        totalCarburanteDia = 0;
        totalServiciosDia = 0;
        if (!(listaAFormatear.filter(x => x.FechaComparar.toDateString() == element.emissionUTCDateTime.toDateString()).length > 0)) {
          this.documentList.filter(x => x.emissionUTCDateTime.toDateString() == element.emissionUTCDateTime.toDateString()).forEach(elementLine => {
            totalTiendaDia += elementLine.lines
              .filter(function (z) {
                if (z.typeArticle.includes('TIEN')) {
                  if (categoriaABuscar.indexOf(z.idCategoria) > -1) {
                    return true;
                  }
                  return false;
                }
                return false;
              }).reduce(function (accumulator, line) {
                return accumulator + line.totalAmountWithTax;
              }, 0);

            totalCarburanteDia += elementLine.lines
              .filter(z => z.typeArticle.includes('COMB') && (categoriaABuscar.indexOf(z.idCategoria) > -1
                || z.idCategoria === '')).reduce(function (accumulator, line) {
                  return accumulator + line.totalAmountWithTax;
                }, 0);

            totalServiciosDia += elementLine.lines
              .filter(z => z.typeArticle.includes('SERV') && (categoriaABuscar.indexOf(z.idCategoria) > -1
                || z.idCategoria === '')).reduce(function (accumulator, line) {
                  return accumulator + line.totalAmountWithTax;
                }, 0);
          });

          listaAFormatear.push({
            Fecha: element.emissionLocalDateTime,
            Tienda: totalTiendaDia,
            Carburante: totalCarburanteDia,
            Servicios: totalServiciosDia,
            FechaComparar: element.emissionUTCDateTime,
            TotalDia: totalTiendaDia + totalCarburanteDia + totalServiciosDia
          });
        }
      });

      this.documentListVentas = listaAFormatear;

      listaAFormatear.forEach(elementA => {
        this.TotalGridRecaudacion.Tienda += elementA.Tienda;
        this.TotalGridRecaudacion.Carburante += elementA.Carburante;
        this.TotalGridRecaudacion.Servicios += elementA.Servicios;
      });
      // this.documentList.reduce;

      // tabla resumen de recaudacion
      // OBTENEMOS LA CABECERA DE LA TABLA

      this.documentList.forEach(elementRe => {
        totalMedioPago = 0;

        if (!(listaAFormatearRe.filter(x => x.Fecha.toDateString() == elementRe.emissionUTCDateTime.toDateString()).length > 0)) {
          informesAdd = { Fecha: elementRe.emissionUTCDateTime, ListaMedios: [] };
          informesAdd.ListaMedios = [];
          elementRe.paymentDetails.forEach(elementPay => {

            this.documentList
              .filter(xd => xd.emissionUTCDateTime.toDateString() == elementRe.emissionUTCDateTime.toDateString())
              .forEach(elementPago => {
                totalMedioPago += elementPago.paymentDetails
                  .filter(xp => xp.paymentMethodId == elementPay.paymentMethodId).reduce(function (accumulator, payment) {
                    return accumulator + payment.primaryCurrencyTakenAmount;
                  }, 0);
              });

            MedioPagoAdd = {
              CodigoMedio: elementPay.paymentMethodId,
              Importe: totalMedioPago,
              Nombre: this._appDataConfig.paymentMethodList.find(pm => pm.id === elementPay.paymentMethodId).description
            };

            informesAdd.ListaMedios.push(MedioPagoAdd);

            totalMedioPago = 0;
          });

          if (!(elementRe.paymentDetails.length == 0)) {
            listaAFormatearRe.push(informesAdd);
          }

        } else {
          elementRe.paymentDetails.forEach(elementPay => {
            if (!((listaAFormatearRe
              .find(x => x.Fecha.toDateString() == elementRe.emissionUTCDateTime.toDateString())
              .ListaMedios.filter(pm => pm.CodigoMedio == elementPay.paymentMethodId)).length > 0)) {

              this.documentList
                .filter(xd => xd.emissionUTCDateTime.toDateString() == elementRe.emissionUTCDateTime.toDateString())
                .forEach(elementPago => {
                  totalMedioPago += elementPago.paymentDetails
                    .filter(xp => xp.paymentMethodId == elementPay.paymentMethodId).reduce(function (accumulator, payment) {
                      return accumulator + payment.primaryCurrencyTakenAmount;
                    }, 0);
                });

              MedioPagoAdd = {
                CodigoMedio: elementPay.paymentMethodId,
                Importe: totalMedioPago,
                Nombre: this._appDataConfig.paymentMethodList.find(pm => pm.id === elementPay.paymentMethodId).description
              };

              listaAFormatearRe
                .find(x => x.Fecha.toDateString() == elementRe.emissionUTCDateTime.toDateString())
                .ListaMedios.push(MedioPagoAdd);
            }
            totalMedioPago = 0;
          });
        }

      });
      // RECALCULAMOS LAS DEUDAS
      totalDeudas = [];

      this.documentList.forEach(documento => {
        if (documento.paymentDetails.reduce(function (accumulator, payment) {
          return accumulator + payment.primaryCurrencyTakenAmount;
        }, 0) < documento.totalAmountWithTax) {
          totalDeudas.push({
            fecha: documento.emissionUTCDateTime,
            deuda: documento.totalAmountWithTax - documento.paymentDetails.reduce(function (accumulator, payment) {
              return accumulator + payment.primaryCurrencyTakenAmount;
            }, 0)
          });
        }
      });

      totalDeudas.forEach(objDeuda => {
        if (listaAFormatearRe.filter(x => x.Fecha.toDateString() == objDeuda.fecha.toDateString()).length > 0) {
          if (listaAFormatearRe.find(x => x.Fecha.toDateString() == objDeuda.fecha.toDateString()).ListaMedios
            .filter(s => s.CodigoMedio == 'Deuda')
            .length > 0) {

            listaAFormatearRe.find(x => x.Fecha.toDateString() == objDeuda.fecha.toDateString()).ListaMedios
              .find(s => s.CodigoMedio == 'Deuda').Importe += objDeuda.deuda;

          } else {

            MedioPagoAdd = {
              CodigoMedio: 'Deuda',
              Importe: objDeuda.deuda,
              Nombre: 'Deudas'
            };

            listaAFormatearRe.find(x => x.Fecha.toDateString() == objDeuda.fecha.toDateString()).ListaMedios.push(MedioPagoAdd);
          }
        } else {
          deudaAdd = { Fecha: objDeuda.fecha, ListaMedios: [] };
          deudaAdd.ListaMedios = [];

          MedioPagoAdd = {
            CodigoMedio: 'Deuda',
            Importe: objDeuda.deuda,
            Nombre: 'Deudas'
          };

          informesAdd.ListaMedios.push(MedioPagoAdd);
          listaAFormatearRe.push(informesAdd);
        }
      });

      // CALCULAMOS LAS CABECERA
      listaAFormatearRe.forEach(elementCa => {
        elementCa.ListaMedios.forEach(elementMedio => {
          if (!(listaCabeceraFormat.indexOf(elementMedio.Nombre) >= 0)) {
            listaCabeceraFormat.push(elementMedio.Nombre);
          }
        });
      });


      this.listaCabeceraMediosPago = listaCabeceraFormat;
      this.documentListRecaudacion = listaAFormatearRe;

      if (listaAFormatear != undefined && listaAFormatear.length > 0) {
        this.buttonImprimirBool = false;
      } else {
        this.buttonImprimirBool = true;
      }

    } else {
      listaCategoriasDetalles = [];

      listaCategoriasDetalles = this.categoriaSelect;

      listaCategoriasDetalles = listaCategoriasDetalles.filter(x => !(x.includes('allCategorias')));

      this.documentList.forEach(elemento => {
        elemento.emissionUTCDateTime.setHours(0, 0, 0, 0);
      });

      this.documentList.forEach(elementDocumento => {
        elementDocumento.lines.forEach(elementLinea => {
          if (listaCategoriasDetalles.find(r => r === '-4' || r === '-2' || r === '-3')) {

            if (elementLinea.idCategoria === '') {
              if (elementLinea.typeArticle.includes('COMB')) {
                elementLinea.idCategoria = '-2';
                elementLinea.nameCategoria = 'Combustible';
              } else if (elementLinea.typeArticle.includes('TIEN')) {
                elementLinea.idCategoria = '-4';
                elementLinea.nameCategoria = 'Tienda';
              } else if (elementLinea.typeArticle.includes('SERV')) {
                elementLinea.idCategoria = '-3';
                elementLinea.nameCategoria = 'Servicio';
              }
            }
          }
          if (listaCategoriasDetalles.indexOf(elementLinea.idCategoria) != -1 || listaCategoriasDetalles.length <= 0) {
            if (listaAPintar.filter(x => x.CategoriaId == elementLinea.idCategoria).length > 0) {
              if (listaAPintar.find(x => x.CategoriaId == elementLinea.idCategoria).ListaLineas
                .filter(c => c.Fecha.toDateString() == elementDocumento.emissionUTCDateTime.toDateString()).length > 0) {
                if (listaAPintar.find(x => x.CategoriaId == elementLinea.idCategoria).ListaLineas
                  .filter(c =>
                    c.Fecha.toDateString() == elementDocumento.emissionUTCDateTime.toDateString() && c.ArticuloId == elementLinea.productId)
                  .length > 0) {

                  listaAPintar.find(x => x.CategoriaId == elementLinea.idCategoria).ListaLineas
                    .find(c =>
                      c.Fecha.toDateString() == elementDocumento.emissionUTCDateTime.toDateString() && c.ArticuloId == elementLinea.productId)
                    .Cantidad += elementLinea.quantity;

                  listaAPintar.find(x => x.CategoriaId == elementLinea.idCategoria).ListaLineas
                    .find(c =>
                      c.Fecha.toDateString() == elementDocumento.emissionUTCDateTime.toDateString() && c.ArticuloId == elementLinea.productId)
                    .Importe += elementLinea.totalAmountWithTax;

                } else {
                  listaAPintar.find(x => x.CategoriaId == elementLinea.idCategoria).ListaLineas.push({
                    Fecha: elementDocumento.emissionUTCDateTime,
                    Articulo: elementLinea.description,
                    ArticuloId: elementLinea.productId,
                    Cantidad: elementLinea.quantity,
                    Importe: elementLinea.totalAmountWithTax
                  });
                  // .find( c => c.Fecha.toDateString() == elementDocumento.emissionUTCDateTime.toDateString()).Articulo = elementLinea.description;

                  // listaAPintar.find(x => x.CategoriaId == elementLinea.idCategoria).ListaLineas
                  // .find( c => c.Fecha.toDateString() == elementDocumento.emissionUTCDateTime.toDateString()).ArticuloId = elementLinea.productId;

                  // listaAPintar.find(x => x.CategoriaId == elementLinea.idCategoria).ListaLineas
                  // .find( c => c.Fecha.toDateString() == elementDocumento.emissionUTCDateTime.toDateString()).Cantidad = elementLinea.quantity;

                  // listaAPintar.find(x => x.CategoriaId == elementLinea.idCategoria).ListaLineas
                  // .find( c =>
                  // c.Fecha.toDateString() == elementDocumento.emissionUTCDateTime.toDateString()).Importe = elementLinea.totalAmountWithTax;
                }
              }
              else {
                listaAPintar.find(x => x.CategoriaId == elementLinea.idCategoria).ListaLineas
                  .push({
                    Fecha: elementDocumento.emissionUTCDateTime,
                    Articulo: elementLinea.description,
                    ArticuloId: elementLinea.productId,
                    Cantidad: elementLinea.quantity,
                    Importe: elementLinea.totalAmountWithTax
                  });
              }
            }
            else {
              listaAPintar.push({
                CategoriaName: elementLinea.nameCategoria,
                CategoriaId: elementLinea.idCategoria,
                ListaLineas: [{
                  Fecha: elementDocumento.emissionUTCDateTime,
                  Articulo: elementLinea.description,
                  ArticuloId: elementLinea.productId,
                  Cantidad: elementLinea.quantity,
                  Importe: elementLinea.totalAmountWithTax
                }]
              });
            }
          } // else if (elementLinea.idCategoria === '') {
          //   // Articulos sin categorias.
          //   if ( listaAPintar.length > 0) {
          //     listaAPintar.find(x => x.CategoriaId === '-1').ListaLineas
          //     .push({
          //       Fecha: elementDocumento.emissionUTCDateTime,
          //       Articulo: elementLinea.description,
          //       ArticuloId: elementLinea.productId,
          //       Cantidad: elementLinea.quantity,
          //       Importe: elementLinea.totalAmountWithTax
          //     });

          //   } else {
          //     listaAPintar.push({
          //       CategoriaName: 'SIN CATEGORIA',
          //       CategoriaId: '-1',
          //       ListaLineas: [{
          //         Fecha: elementDocumento.emissionUTCDateTime,
          //         Articulo: elementLinea.description,
          //         ArticuloId: elementLinea.productId,
          //         Cantidad: elementLinea.quantity,
          //         Importe: elementLinea.totalAmountWithTax
          //       }]
          //      });
          //   }
          // }
        });
      });
      this.listaAPintarCategorias = [];
      this.listaAPintarCategorias = listaAPintar;

      if (listaAPintar != undefined && listaAPintar.length > 0) {
        this.buttonImprimirBool = false;
      } else {
        this.buttonImprimirBool = true;
      }
    }

    this._statusBar.publishMessage('Generando informes....');
  }




  private _validateDates(): boolean {
    const maxSpanDays = 30;

    const today = new Date();

    // validamos fecha futura
    if (this.fromEmissionDate != undefined) {
      if (this.fromEmissionDate > today) {
        this._statusBar.publishMessage('La fecha desde no puede ser mayor al dia actual');
        // this.validationTextError = 'La fecha de inicio no puede ser a futuro';
        return false;
      }
    }
    if (this.toEmissionDate != undefined) {
      const toEmissionDate00 = new Date(this.toEmissionDate);
      toEmissionDate00.setHours(0, 0, 0, 0);
      if (toEmissionDate00 > today) {
        this._statusBar.publishMessage('La fecha hasta no puede ser mayor al dia actual');
        // this.validationTextError = 'La fecha de fin no puede ser a futuro';
        return false;
      }
    }
    if (this.fromEmissionDate == undefined) {
      // from == undefined
      // from = to(if setted else today) - maxSpan
      this.fromEmissionDate = this._setDateMaxSpan(-maxSpanDays, this.toEmissionDate, this.timeTo, this.timeFrom, true);
    } else {
      if (this.toEmissionDate != undefined) {
        // from != null && to != null
        // check difference

        // ajustamos el time
        (this.timeFrom == undefined || this.timeFrom.toString() == '') ?
          today.setHours(0, 0, 0, 0) : this.fromEmissionDate.setHours(+this.timeFrom.substring(0, 2), +this.timeFrom.substring(3, 5), 0, 0);
        if (this.toEmissionDate !== undefined) {
          (this.timeTo == undefined || this.timeTo.toString() == '') ?
            today.setHours(23, 59, 59, 0) : this.toEmissionDate.setHours(+this.timeTo.substring(0, 2), +this.timeTo.substring(3, 5), 0, 0);
        }

        if (this._differenceDatesInDays(this.fromEmissionDate, this.toEmissionDate) > maxSpanDays) {
          // the difference is greater than the max span allowed
          // this.validationTextError = `El rango de días no puede ser superior a ${maxSpanDays}`;
          this._statusBar.publishMessage('El rango de días no puede ser superior a ' + maxSpanDays + ' dias');
          return false;
        }
      } else {
        // from != null && to == undefined
        // to = from + maxSpan
        this.toEmissionDate = this._setDateMaxSpan(maxSpanDays, this.fromEmissionDate, this.timeTo, this.timeFrom, false);

      }
    }
    // establecemos hora de inicio y final para abarcar todo el time
    // if (this.fromEmissionDate != undefined) {
    //   this.fromEmissionDate.setHours(0, 0, 0, 0);
    // }
    // if (this.toEmissionDate != undefined) {
    //   this.toEmissionDate.setHours(23, 59, 59, 999);
    // }
    return true;
  }
  private _setDateMaxSpan(maxSpan: number, dateOrigen: Date, timeTo: string, timeFrom: string, isFrom: boolean): Date {
    const today = new Date();
    isFrom ?
      (this.timeFrom == undefined || this.timeFrom.toString() == '') ?
        today.setHours(0, 0, 0, 0) : today.setHours(+timeFrom.substring(0, 2), +timeFrom.substring(3, 5), 0, 0) :
      (this.timeTo == undefined || this.timeTo.toString() == '') ?
        today.setHours(0, 0, 0, 0) : today.setHours(+timeTo.substring(0, 2), +timeTo.substring(3, 5), 0, 0);
    const date = dateOrigen == undefined ? new Date() : new Date(dateOrigen);
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() + maxSpan);
    if (date.getTime() >= today.getTime()) {
      // if date is greater or equal than today
      return undefined;
    }
    return date;
  }

  // return the difference in days between 2 dates ignoring the time
  private _differenceDatesInDays(from: Date, to: Date): number {
    // const from_0Hour = new Date(from.getTime());
    // from_0Hour.setHours(0, 0, 0, 0);
    // const to_0Hour = new Date(to.getTime());
    // to_0Hour.setHours(0, 0, 0, 0);
    let timeDiff: number;
    timeDiff = Math.abs(new Date(to).getTime() - new Date(from).getTime());
    return Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
  }


  checkTotal(lineaCat: LineListVentasCategorias, u: number, i: number): boolean {

    if (u == 0 && i == 0) { // primer registro, reiniciamos
      this.dateCategoriasTotal = undefined;
    }
    if (this.listaAPintarCategorias[u].ListaLineas.length == i + 1) { // comprobamos si es el último registro
      return true;
    } else {
      if (this.listaAPintarCategorias[u].ListaLineas.length > i + 1) { // Quedan mas registros, Miramos la fecha del siguiente
        if (this.listaAPintarCategorias[u].ListaLineas[i].Fecha.toDateString() ==
          this.listaAPintarCategorias[u].ListaLineas[i + 1].Fecha.toDateString()) {
          return false;
        }
        return true;
      }
      return true;
    }
  }


  getImporte(lineaCat: LineListVentasCategorias, u: number, i: number): number {
    // let categoriaId: string;
    let fechaBusq: Date;

    let calculoTotal: number = 0;

    // categoriaId = this.listaAPintarCategorias[u].ListaLineas[i].ArticuloId;
    fechaBusq = this.listaAPintarCategorias[u].ListaLineas[i].Fecha;


    calculoTotal = this.listaAPintarCategorias[u].ListaLineas
      .filter(x => x.Fecha.toDateString() == fechaBusq.toDateString())
      .reduce(function (accumulator, line) {
        return accumulator + line.Importe;
      }, 0);

    return calculoTotal;
  }

  getImporteMediosPago(itemRecaudacion: InformeVentasRecaudacion, itemMediosPago: string): number {

    let importeT: number = 0;

    importeT = itemRecaudacion.ListaMedios.find(x => x.Nombre === itemMediosPago) != undefined ?
      itemRecaudacion.ListaMedios.find(x => x.Nombre === itemMediosPago).Importe : 0;

    return importeT;
  }

  selectAllTest(param: MdButtonToggle) {
    this.categoriaSelect = this.categoriaList.map(x => {
      return x.codigo;
    });
  }

  cleanAllTest(param: MdButtonToggle) {
    this.categoriaSelect = [];
  }

  limpiarFiltrosBusquedas() {
    this.categoriaSelect = [];
    this.documentListRecaudacion = [];
    this.documentListVentas = [];
    this.buttonImprimirBool = true;
    // this.mostrarMultiSelect = false;
    this.listaAPintarCategorias = [];
    this.timeFrom = undefined;
    this.timeTo = undefined;
    this.fromEmissionDate = undefined;
    this.toEmissionDate = undefined;
  }

  getImporteTotal(item: InformeVentasCategorias): number {

    let importeT: number = 0;

    importeT = item.ListaLineas.reduce(function (accumulator, line) {
      return accumulator + line.Importe;
    }, 0);

    return importeT;
  }

  sendPrintInforme() {
    let sendPrintFunc: Observable<boolean>;
    let templateTicketInforme: string = '';

    if (this.radioButtonSelected.includes(this.radioButtonsGroup[0])) {
      templateTicketInforme = 'RESUMENVENTAS';
    } else {
      templateTicketInforme = 'DETALLESVENTAS';
    }

    sendPrintFunc = this._documentService.sendInvoiceInformes(this.documentListRecaudacion,
      this.documentListVentas, this.listaAPintarCategorias, templateTicketInforme);

    sendPrintFunc.first().subscribe(
      response => {
          this._logHelper.trace('TODO OK IMPRESION desde el informe', response);
      }, (err) => this._logHelper.logError(' Error impresion desde el informe:', err));
  }
}
