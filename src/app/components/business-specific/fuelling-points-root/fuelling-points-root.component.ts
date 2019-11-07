/*** componente wrapper para evitar depedencias circulares ***/
import { Component, OnInit, AfterViewInit, ElementRef, ViewChild, ViewContainerRef } from '@angular/core';
import { IDimensionable } from 'app/shared/idimensionable';
import { HostDimensionable } from 'app/shared/host-dimensionable';
import { IViewContainerReferenceable } from 'app/shared/iview-container-referenceable';

@Component({
  selector: 'tpv-fuelling-points-root',
  templateUrl: './fuelling-points-root.component.html',
  styleUrls: ['./fuelling-points-root.component.scss']
})
export class FuellingPointsRootComponent extends HostDimensionable
implements OnInit, AfterViewInit, IDimensionable, IViewContainerReferenceable {
  @ViewChild('fuellingPointsHost', { read: ViewContainerRef }) viewContainerRef: ViewContainerRef;

  constructor(
    private _elRef: ElementRef,
  ) { super(); }

  ngOnInit() {
  }

  ngAfterViewInit() {
    this._elRef.nativeElement.classList.add('noP');
  }
}
