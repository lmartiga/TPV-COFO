import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { PluItem } from 'app/shared/plu/plu-item';

@Component({
  selector: 'tpv-accordion',
  templateUrl: './accordion.component.html',
  styleUrls: ['./accordion.component.scss']
})
export class AccordionComponent implements OnInit {

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

  onSelectedProductById(id: string) {
    this.productSelected.emit(id);
  }
}
