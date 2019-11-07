import { Component, ViewChild, ViewContainerRef, ElementRef, AfterViewInit } from '@angular/core';
import { LayoutAreaItemType } from 'app/shared/layout/layout-area-item-type.enum';
import { IContainer } from 'app/shared/icontainer';
import { HostDimensionable } from 'app/shared/host-dimensionable';

@Component({
  selector: 'tpv-layout-stack-container',
  templateUrl: './layout-stack-container.component.html',
  styleUrls: ['./layout-stack-container.component.scss']
})
export class LayoutStackContainerComponent extends HostDimensionable implements IContainer, AfterViewInit {

  type: LayoutAreaItemType.columnsContainer | LayoutAreaItemType.rowsContainer;
  @ViewChild('stackContainerHost', { read: ViewContainerRef }) viewContainerRef: ViewContainerRef;

  constructor(
    private _elRef: ElementRef
  ) {
    super();
  }

  ngAfterViewInit(): void {
    this._elRef.nativeElement.classList.add('tpv-layout-stack-container');
  }
}
