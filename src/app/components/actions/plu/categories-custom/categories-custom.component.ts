import { Component, OnInit, Input, Output, EventEmitter, OnDestroy } from '@angular/core';
import { PluItem } from 'app/shared/plu/plu-item';
import { Subscription } from 'rxjs/Subscription';
/* //import { DocumentSeriesService } from 'app/services/document/document-series.service'; */
import { isNullOrUndefined } from 'util';
import { LanguageService } from 'app/services/language/language.service';
import { LogHelper } from 'app/helpers/log-helper';
@Component({
  selector: 'tpv-categories-custom',
  templateUrl: './categories-custom.component.html',
  styleUrls: []
})
export class CategoriesCustomComponent implements OnInit, OnDestroy {
  @Input() showSearchResult: boolean;
  @Input() pluItems: Array<PluItem>;
  @Output() productSelected: EventEmitter<string> = new EventEmitter();
  contadorFinArticulos = 15;
  contadorIniArticulos = 0;
  contadorFinCategoria = 7;
  contadorIniCategoria = 0;
  // Productos que se muestran actualmente en la PLU
  currentPLUItem: PluItem;
  activeCleanSubscription: Subscription = {} as Subscription;
  currentCategories: string = '';

  constructor(
   // private _documentSeriesService: DocumentSeriesService
   private _languageService: LanguageService,
   private  _logHelper: LogHelper
  ) {}

  ngOnInit() {
    this.setCurrentPLUItem(0);
  }


  setCurrentPLUItem(id: any, index: any = 0) {
    this.contadorFinArticulos = 15;
    this.contadorIniArticulos = 0;
    try {
      // compruebo que le pluItems este dentro del rango
    if (id != '' || this.pluItems.length > 0) {
      this.currentPLUItem = this.pluItems.find( x => x.id == id);
      if (this.currentPLUItem != undefined) {
        this.currentCategories = this.currentPLUItem.description;
        jQuery('.CategoriaPlu').css('background-color', 'rgb(13, 133, 155)');
        jQuery('#CategoriaPlu-' + index).css('background-color', '#003b5c');
      }
    }
    } catch (error) {
      this._logHelper.trace('Error presentado al obtener categorias ' + error);
    }
  }

  cleanCurrentPLUItem() {
    this.currentPLUItem = undefined;
  }

  isVoidCurrentPLUItem(): boolean {
    if (this.currentPLUItem == undefined) {
      return true;
    }
    return false;
  }

  getColorString(index: number) {
    if (this.pluItems[index].color !== undefined) {
      return 'rgb(' + this.pluItems[index].color.r + ', ' + this.pluItems[index].color.g + ', ' + this.pluItems[index].color.b + ')';
    } else {
      return 'rgb(13, 133, 155)';
      //return 'rgb(255, 255, 255)';
    }
  }

  onSelectedProductById(id: string, ind: number) {
    this.productSelected.emit(id);
    jQuery('.CurrentPLUItem').css('border-color', '#ffffff');
    jQuery('#CurrentPLUItem' + ind).css('border-color', '#003b5c');
    jQuery('#CurrentPLUItem' + ind).css('border-width', '2px');
    jQuery('#CurrentPLUItem' + ind).css('border-style', 'solid');
  }

  ngOnDestroy() {
  if (this.activeCleanSubscription) {
      this.activeCleanSubscription.unsubscribe();
    }
  }
  cantidadCurrentPLUItem(): number {
    return isNullOrUndefined(this.currentPLUItem) ? 0 : this.currentPLUItem.productList.length;
  }


  listarArticulos() {

    if (this.currentPLUItem != undefined) {
      for (let index = 0; index < this.currentPLUItem.productList.length; index++) {
        this.currentPLUItem.productList[index].description  = this.doslineas(this.currentPLUItem.productList[index].description);
        this.currentPLUItem.productList[index].description = this.quitarespacios(this.currentPLUItem.productList[index].description);
        const cadin = this.currentPLUItem.productList[index].description.substr(0, 1);
        const cadfin = this.currentPLUItem.productList[index].description.substr(1, undefined);
        this.currentPLUItem.productList[index].description = cadin.toUpperCase() + cadfin.toLowerCase();
      }
    }
    return isNullOrUndefined(this.currentPLUItem) ? undefined :
    this.currentPLUItem.productList.slice(this.contadorIniArticulos , this.contadorFinArticulos) ;
  }
  quitarespacios(cadena: string) {
    if (cadena != undefined) {
      const espacio = cadena.substr(0, 1);
      if (espacio == ' ') {
        cadena = cadena.substr(1, undefined);
        this.quitarespacios(cadena);
      }
      return cadena;
    }
    return cadena;
  }

  listarcategoria() {
    if (this.pluItems != undefined) {
      for (let index = 0; index < this.pluItems.length; index++) {
        this.pluItems[index].description = this.doslineas(this.pluItems[index].description);
        this.pluItems[index].description = this.quitarespacios(this.pluItems[index].description);
        const cadin = this.pluItems[index].description.substr(0, 1);
        const cadfin = this.pluItems[index].description.substr(1, undefined);
        this.pluItems[index].description = cadin.toUpperCase() + cadfin.toLowerCase();
      }
  }
    return isNullOrUndefined(this.pluItems) ? undefined :
    this.pluItems.slice(this.contadorIniCategoria , this.contadorFinCategoria) ;
  }
  doslineas(cadena: string) {
    if (cadena != undefined) {
      if (cadena.indexOf('/') >= 0) {
        if (cadena.indexOf('/ ') >= 0) {
          return cadena;
        } else {
          cadena = cadena.replace('/', '/ ');
        }
        return cadena;
      } else {
        return cadena;
      }
    }
    return cadena;
  }
  actualizarArticulos(tipo: string) {
    if (tipo == '+') {
      if ( this.contadorFinArticulos <= this.cantidadCurrentPLUItem() ) {
        this.contadorIniArticulos = this.contadorFinArticulos;
        this.contadorFinArticulos = this.contadorFinArticulos + 14;
      }
    } else {
      if ( this.contadorIniArticulos == 15 ) {
        this.contadorIniArticulos = 0;
        this.contadorFinArticulos = this.contadorFinArticulos - 14;
      } else {
        this.contadorIniArticulos = this.contadorIniArticulos - 14;
        this.contadorFinArticulos = this.contadorFinArticulos - 14;
      }
    }
  }

  actualizarCategorias(tipo: string) {
    if (tipo == '+') {
      if ( this.contadorFinCategoria <= this.pluItems.length) {
        this.contadorIniCategoria = this.contadorFinCategoria;
        this.contadorFinCategoria = this.contadorFinCategoria + 6;
      }
    } else {
      if ( this.contadorIniCategoria == 7 ) {
        this.contadorIniCategoria = 0;
        this.contadorFinCategoria = this.contadorFinCategoria - 6;
      } else {
        this.contadorIniCategoria = this.contadorIniCategoria - 6;
        this.contadorFinCategoria = this.contadorFinCategoria - 6;
      }
    }
  }

   getLiteral(group: string, key: string): string {
    return this._languageService.getLiteral(group, key);
  }
}
