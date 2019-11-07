import { Component, OnInit, AfterViewInit, ElementRef } from '@angular/core';
import { SearchPluProduct } from 'app/shared/plu/search-plu-product';
import { PluItem } from 'app/shared/plu/plu-item';
import { PluService } from 'app/services/plu/plu.service';
import { StatusBarService } from 'app/services/status-bar/status-bar.service';
import { FormatHelper } from 'app/helpers/format-helper';
import { PluProduct } from 'app/shared/plu/plu-product';
import { Subject } from 'rxjs/Subject';
import { AppDataConfiguration } from 'app/config/app-data.config';
// import { LogHelper } from 'app/helpers/log-helper';
import { LanguageService } from 'app/services/language/language.service';
import { PluInternalService } from 'app/services/plu/plu-internal.service';
// import { GenericHelper } from 'app/helpers/generic-helper';
import { KeyboardInternalService } from 'app/services/keyboard/keyboard-internal.service';
import { Subscription } from 'rxjs/Subscription';
import { DocumentInternalService } from 'app/services/document/document-internal.service';
import { SessionInternalService } from 'app/services/session/session-internal.service';
import { ElectronicJournalService } from 'app/services/electronic-journal/electronic-journal.service';
import { ActionType } from 'app/shared/electronic-journal/action-type.enum';
import { LogHelper } from 'app/helpers/log-helper';

@Component({
  selector: 'tpv-plu',
  templateUrl: './plu.component.html',
  styleUrls: ['./plu.component.scss']
})
export class PluComponent implements OnInit, AfterViewInit {

  // para poner el foco en el input
  // @ViewChild('inputSearch') inputSearch: ElementRef;

  // Unidades de un producto a insertar como línea de documento (por defecto es 1)
  units = 1;
  // Dato de la búsqueda en el modelo
  dataSearch: string = '';
  // Items iniciales en la PLU al iniciar
  pluItems: Array<PluItem> = [];
  // Items resultado de la búsqueda
  searchProducts: Array<SearchPluProduct>;
  // Indica si la búsqueda está activa o no
  showSearchResult = false;
  // Mensaje a mostrar cuando hay error en la búsqueda o no hay resultados
  searchErrorMessage: string;
  // validacion para enveto unicamente del Barcodes
  pressEnterBarcodes: boolean = false;
  // se muestra popup
  activarpopup: boolean = false;
  // variables para retrasar la busqueda al teclear
  private _swipeTimeOut: NodeJS.Timer;
  private _swipeTimeOutMilliseconds: number;

  // numero de veces que se ha cambiado el input antes de que de timeout para saber si ha sido un codigo de barras

  private _searchComplete: Subject<Array<SearchPluProduct>> = new Subject();
  private countSearching: number = 0;
  private _isSearching = false;
  isSearchingByBarcode: boolean = false;
  private _searchTemporallyDisabled = false; // Sirve para inhinibir las busquedas iniciadas antes de modificar el texto de búsqueda.

  // variables para controlar la experiencia con escáner de códigos
  private _isProductSelected = true; // Sirve para inhibir la muestra de productos encontrados cuando se usa el scanner (entrada muy rápida).
  private _showResultsDelay = 150; // Temporización de retraso de muestra para búsquedas con un único resultado.

  // parametro de configuración
  private readonly _pluViewConfiguration: string;
  private _subscriptions: Subscription[] = [];


  constructor(
    private _elRef: ElementRef,
    private _pluService: PluService,
    private _statusBarService: StatusBarService,
    private _appDataConfig: AppDataConfiguration,
    private _languageService: LanguageService,
    private _pluInternalService: PluInternalService,
    private _keyboardInternalSrv: KeyboardInternalService,
    private _documentInternalService: DocumentInternalService,
    private _session: SessionInternalService,
    private _electronicJournal: ElectronicJournalService,
    private  _logHelper: LogHelper
  ) {
    // (<any>window).addProductByBarcode = (barcode: string) => this._addProductByBarcode(barcode);
    // window.addEventListener('keyup', () => this._addProductByBarcode());

    this.searchProducts = [];

    this._pluViewConfiguration = this._appDataConfig.pluViewConfiguration;
    this._swipeTimeOutMilliseconds = this._appDataConfig.millisecToWaitBetweenKeypressForSearchProduct;
    this._pluViewConfiguration = 'CATEGORIES_CUSTOM';
  }

  // private _addProductByBarcode(barcode: string) {
  //   if (barcode != '' && barcode != undefined && GenericHelper.isValidBarcode(barcode)) { // Pana - Si no puede buscar con el lector
  //     if (!this._pluService.canSearchWithBarcode) {
  //       return;
  //     }
  //     if (typeof barcode === 'string') {
  //       this.isSearchingByBarcode = true;


  //       this._pluService.insertProductToDocument(this.units, undefined, barcode).first().subscribe(isInserted => {
  //         if (isInserted == true) {
  //           this.resetSearch(true);
  //         } else if (this._isSearching == true) {
  //           if(this.dataSearch != "")
  //           {
  //             this.search();
  //           }

  //         }
  //         else {
  //           this._statusBarService.publishMessage(
  //             this.getLiteral('plu_component', 'error_SearchProducts_NoResults') !== undefined
  //               ? this.getLiteral('plu_component', 'error_SearchProducts_NoResults')
  //               : 'El código de barras solicitado no está dado de alta.');
  //           this.searchErrorMessage = 'No se han encontrado resultados en la búsqueda.';
  //         }
  //       });
  //     }
  //   }
  // }

  ngOnInit() {
    this._getPluItems();
    this._pluService.canSearchWithBarcode = true; // Pana - Para poder buscar con el lector

    this._subscriptions.push(this._session.DesactivarPopup$.subscribe(data => {
      if (data == false) {
        this.activarpopup = data;
        }
     }));

    this._subscriptions.push(this._keyboardInternalSrv.Barcode$.subscribe(rpta => {
      if (this.activarpopup != true) {
        if (this._documentInternalService.currentDocument.BarcodeStatus == undefined ||
          this._documentInternalService.currentDocument.BarcodeStatus == false) {
          if (this.dataSearch == '') {
            this._searchTemporallyDisabled = false;
            this._searchPluProductsFoco(rpta);
          }
        }
      }
    }));
  }

  ngAfterViewInit() {
    this._elRef.nativeElement.classList.add('tpv-plu');
    this.loadScript('../assets/js/barcode-listener.js');
  }

  /*setInputFocus() {
    if (this.inputSearch) {
      (this.inputSearch.nativeElement as HTMLElement).focus();
    }
  }*/

  // Validación del texto de búsqueda (si búsqueda >3 caracteres pedir productos)
  onSearchChange(): void {
    // IE bug: placeholder trigger ngModelChange. Esto causa que se establezca el foco
    // if (this.dataSearch)
    // si se pasa de tiempo se busca el cliente

    // TIMEOUT BUG: Al obtener una cadena desde lector, debido al retardo de comienzo de la busqueda,
    // el flag que indica que hay una busqueda no esta activo al momento de capturar el evento de tecla
    // "enter" de teclado.
    this._isSearching = true;

    // Si se realizo una busqueda con el Bardcodes, ya no se necesita controlar la escritura
    if (!this.pressEnterBarcodes) {
      if (this._swipeTimeOut == undefined) {
        this._swipeTimeOut = setTimeout(() => this.search(), this._swipeTimeOutMilliseconds);
      } else {
        clearTimeout(this._swipeTimeOut);
        this._swipeTimeOut = setTimeout(() => this.search(), this._swipeTimeOutMilliseconds);
      }
    }
  }

  /**
   * Cancela la búsqueda a PLU y borra lo introducido
   * @param setFocus Indica si se debe restablecer foco.
   * IE BUG: el placeholder dispara evento onChange, lo que provocaba
   * que en la validacion, al estar vacio provocaba un reset y este
   * establecia el foco. Provoando error en la ui.
   * Indico expresamente que restablezca focus unicamente al pulsar
   * boton reset en ui
   */
  resetSearch(setFocus = false): void {
    /*if (setFocus) {
      this.setInputFocus();
    }*/
    this.dataSearch = '';
    this.units = 1;
    this.searchProducts = [];
    this.showSearchResult = false;
    this._isSearching = false;
    this.isSearchingByBarcode = false;
  }

  // Inserta linea al pulsar intro habiendo solo un producto
  // como resultado de la búsqueda realizada en PLU
  onSelectedProduct() {
    // si esta buscando, esperamos a que finalice.
    if (this._isSearching) {
      // Limpia el timer de busqueda, por si se haya lanzado anteriormente
      clearTimeout(this._swipeTimeOut);
      this.pressEnterBarcodes = true;
      if (this.countSearching == 0) {
        this._pluInternalService.disabledResetDocument(true);
        this._statusBarService.publishMessage('Buscando..');
      }
      // Si se preciono Enter, forza la busqueda inmediata del numero ingresado
      this.search();

      this._logHelper.trace('esperamos q termine de buscar');
      this._searchComplete.asObservable()
        .first().subscribe(response => {
          if (response) {
            this._productSelected(response);
            this._pluInternalService.disabledResetDocument(false);
          }
        });
    } else {
      // por defecto se envia undefined para que utilice los productos por busqueda escrita manualmente
      this._productSelected(undefined);
    }

  }

  private _productSelected(searchProducts: Array<SearchPluProduct>) {
    if (searchProducts === undefined) {
      searchProducts = this.searchProducts;
    }
    this.pressEnterBarcodes = false;
    const textToSearch: string = this.dataSearch + '';
    if (textToSearch != '' && searchProducts && searchProducts.length == 1) {
      this._isProductSelected = true; // se ha consumido el único producto encontrado
      this.onSelectedProductById(searchProducts[0].id, true);
    }
    // se comenta porque esta demas esta funcionalidad ya que si no cumple el primer if se va mostrar
    // la lista de los articulos con el mismo codigo de barras/nombre.
    // else {
    //   this._isProductSelected = true;

    //   if(this.searchProducts.length == 1)
    //   {
    //     this.onSelectedProductById(this.searchProducts[0].id, true);
    //   }
    // }
  }

  // cuando clica en un producto de la PLU se envía como línea del documento
  // tanto de la PLU por defecto como de la búsqueda
  // alex: el servicio sera quien se encargue de recuperar el producto
  // y la gestion de introducir en documento y/o manejar errores
  onSelectedProductById(id: string, resetSearch?: boolean): void {

    // Electronic Journal - productEntered / productInPLUSelected
    this._electronicJournal.writeAction({
      type: ((this.showSearchResult === true || resetSearch === true) ? ActionType.productEntered : ActionType.productInPLUSelected),
      productId: id
      });

    this._pluService.insertProductToDocument(this.units, id)
      .first().subscribe(response => {
        if (resetSearch) {
          this.resetSearch();
        }
        this.units = 1;
      });
  }


  private search() {
    const textToSearch: string = this.dataSearch + '';
    // si no es válido cancela dicha búsqueda
    if (textToSearch == '' || textToSearch == undefined) {
      this._searchTemporallyDisabled = true; // Inhibimos la búsqueda porque no hay texto.
      return this.resetSearch();
    }

    // siendo válido realizaría la búsqueda
    if (textToSearch.length >= 3) {
      this._searchTemporallyDisabled = false; // Desinhibimos las búsqueda.
      this._isProductSelected = false; // Inicializamos el flag que indica si ya se consumió algún producto del resultado
      this._searchPluProducts(textToSearch);
    } else {
      this._searchTemporallyDisabled = true; // Inhibimos la búsqueda porque no hay caracteres suficientes
    }
  }

  // búsqueda de productos en el servicio según texto de búsqueda ya validado
  private _searchPluProducts(textToSearch: string) {
    this._isSearching = true;
    this.countSearching += 1;

    this._pluService.searchProduct(textToSearch)
      .first()
      .subscribe(
        response => {
          if (!this._searchTemporallyDisabled) {
            if (!response.productList || response.productList.length == 0) {
                this.searchErrorMessage = this.getLiteral('plu_component', 'error_SearchProducts_NoResults');
                this.searchProducts = [];
            } else {
              this.searchProducts = response.productList as Array<SearchPluProduct>;
            }
            // Si se tiene mas de un observable en espera de respuesta,
            // quiere decir que se invoco mas de una busqueda.
            // Dado ese caso, se da respuestas para cada busqueda o instancia de escucha del observable
            if (this._searchComplete != undefined && this._searchComplete.observers.length > 0) {
              this._searchComplete.observers[0].next(this.searchProducts);
            }
            if (this._searchComplete.observers.length == 0) {
              this._pluInternalService.disabledResetDocument(false);
              this.countSearching = 0;
              this._statusBarService.publishMessage('Busqueda completada');
            }
          }
        },
        error => {
          this._logHelper.trace(error);
          this.searchErrorMessage = this.getLiteral('plu_component', 'error_SearchProducts_ErrorFoundOnSearch');
          this.searchProducts = [];
        },
        () => {
            this._isSearching = false;
            if (!this._searchTemporallyDisabled) {
              if (this.searchProducts.length == 1) {
                setTimeout(() => {
                  if (!this._isProductSelected == true) {
                    this.showSearchResult = true;
                  }
                }, this._showResultsDelay);
              } else {
                this.showSearchResult = true;
              }
            }
          // this._searchComplete.next(true);
        });
  }

  // se ordenan los items de la PLU según el orden relativo
  private _sortPluItems() {
    if (this.pluItems && this.pluItems.length > 0) {
      this.pluItems = this.pluItems.sort((itemx, itemy) => {
        if (itemx.relativeOrder > itemy.relativeOrder) {
          return 1;
        }
        if (itemx.relativeOrder < itemy.relativeOrder) {
          return -1;
        }
        return 0;
      });
    }
  }

  // Añade lista de productos sin categoria si hay, en grupo SIN CATEGORIA
  private _agrupatePluItemsWithoutCategory(itemWithoutGroupList: PluProduct[]) {
    if (itemWithoutGroupList && itemWithoutGroupList.length != 0) {
      const pluGroupWithoutCategory: PluItem = {
        groupId: '',
        description: this.getLiteral('plu_component', 'accordionHeader_PLU_NoCategory'),
        productList: itemWithoutGroupList,
        relativeOrder: this.pluItems.length + 1
      };
      this.pluItems.push(pluGroupWithoutCategory);
    }
  }

  // Obtiene principales items que aparecen en la PLU por categorias
  private _getPluItems() {
    this._pluService.getPluItems()
      .first()
      .subscribe(
        response => {
          this._logHelper.trace('OBTENEMOS PLU ITEMS:');
          this._logHelper.trace(response);
          if (!response.pluGroupList && !response.itemWithoutGroupList) {
            console.log(FormatHelper.formatResponseStatusMessage(response.status));
          } else {
            this.pluItems = response.pluGroupList as Array<PluItem>;
            this._sortPluItems();
            this._agrupatePluItemsWithoutCategory(response.itemWithoutGroupList);
          }
        },
        error => {
          this._logHelper.trace('ERROR PLU ITEMS:');
          this._logHelper.trace(error);
          this._statusBarService.publishMessage(this.getLiteral('plu_component', 'error_PLU_ErrorRetrievingPLUProducts'));
        });
  }

  get pluViewConfiguration() {
    if (this._pluViewConfiguration !== undefined) {
      return this._pluViewConfiguration;
    } else {
      return this.getLiteral('plu_component', 'viewConfiguration_PLU_Category');
    }
  }
  public loadScript(url: string) {
    const body = <HTMLDivElement>document.body;
    const script = document.createElement('script');
    script.innerHTML = '';
    script.src = url;
    script.async = false;
    script.defer = true;
    body.appendChild(script);
  }

  getLiteral(group: string, key: string): string {
    return this._languageService.getLiteral(group, key);
  }
  private _searchPluProductsFoco(textToSearch: string) {
    this._isSearching = true;
    this.countSearching += 1;

    this._pluService.searchProductBarcode(textToSearch)
      .first()
      .subscribe(
        response => {
          if (!this._searchTemporallyDisabled) {
            if (!response.productList || response.productList.length == 0) {
                this._session.fnActivacionPopup(true);
                this.activarpopup = true;
                this._statusBarService.publishMessage(this.getLiteral('plu_component', 'error_SearchProducts_NoResults'));
                // this.searchProducts = [];
                // this.dataSearch = '';
                this.resetSearch();
            } else {
              this.searchProducts = response.productList as Array<SearchPluProduct>;
                if (this.searchProducts.length == 1) {
                  this._pluService.insertProductToDocument(this.units, this.searchProducts[0].id)
                  .first().subscribe(response => {
                    this.resetSearch();
                  });
                }
            }
          }
        },
        error => {
          this._logHelper.trace(error);
          this.searchErrorMessage = this.getLiteral('plu_component', 'error_SearchProducts_ErrorFoundOnSearch');
          this.searchProducts = [];
        },
        () => {
            this._isSearching = false;
        });
  }
}

