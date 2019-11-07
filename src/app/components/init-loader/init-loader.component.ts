import { Component, Input } from '@angular/core';
import {
  trigger,
  state,
  style,
  animate,
  transition
} from '@angular/animations';

@Component({
  selector: 'tpv-init-loader',
  templateUrl: './init-loader.component.html',
  styleUrls: ['./init-loader.component.scss'],
  animations: [
    trigger('loaderState', [
      state('inactive', style({
        opacity: '0'
      })),
      state('active', style({
        opacity: '1'
      })),
      transition('active => inactive', animate('1000ms ease-out'))
    ])
  ]
})
export class InitLoaderComponent {
  loaderState = 'active';
  active = true;
  @Input()
  progressBarValue: number;
  @Input()
  synchronizationStatus: string;

  @Input()
  set LoaderState(newState: string) {
    // Se aplica la transición
    this.loaderState = newState;
    // Como la transición dura 1000ms, esperamos ese tiempo antes de quitar el overlay del dom
    setTimeout(() => this.active = newState == 'active' ? true : false, 1000);
  }

  constructor(
  ) {
  }
}
