import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { PluItem } from 'app/shared/plu/plu-item';

@Component({
  selector: 'tpv-categories-multilevel',
  templateUrl: './categories-multilevel.component.html',
  styleUrls: ['./categories-multilevel.component.scss']
})
export class CategoriesMultilevelComponent implements OnInit {

  @Input() showSearchResult: boolean;
  @Input() pluItems: Array<PluItem>;
  @Output() productSelected: EventEmitter<string> = new EventEmitter();

  // Productos que se muestran actualmente en la PLU
  currentPLUItem: PluItem;

  constructor(
  ) {
  }

  ngOnInit() {
  }

  setCurrentPLUItem(index: number) {
    // compruebo que le pluItems este dentro del rango
    if (index >= 0 || index <= this.pluItems.length) {
      this.currentPLUItem = this.pluItems[index];
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
      return 'rgb(255, 255, 255)';
    }
  }

  onSelectedProductById(id: string) {
    this.productSelected.emit(id);
  }
}
