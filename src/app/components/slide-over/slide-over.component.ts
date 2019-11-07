import {
  Component,
  ViewContainerRef,
  ViewChild,
  ElementRef,
  HostBinding,
  OnInit,
  AfterViewInit,
  OnDestroy
} from '@angular/core';
import {
  trigger,
  state,
  style,
  animate,
  transition
} from '@angular/animations';
import { Observable } from 'rxjs/Observable';
import { Subject } from 'rxjs/Subject';

import { SlideOverOpeningDirection } from 'app/shared/slide-over/slide-over-opening-direction.enum';

import { KeyboardInternalService } from 'app/services/keyboard/keyboard-internal.service';

import { MinimumNeededConfiguration } from 'app/config/minimum-needed.config';
//import { LayoutAreaItemStackContainer } from 'app/shared/layout/layout-area-item-stack-container';
import { GenericHelper } from 'app/helpers/generic-helper';

@Component({
  selector: 'tpv-slide-over',
  templateUrl: './slide-over.component.html',
  styleUrls: ['./slide-over.component.scss'],
  animations: [
    trigger('slideOverState', [
      state('closedRight', style({
        right: '100%'
      })),
      state('closedLeft', style({
        right: '-100%'
      })),
      state('opened', style({
        right: '0%'
      })),
      transition('closedRight <=> opened', animate('0ms')),
      transition('closedLeft <=> opened', animate('0ms'))
    ])
  ]
})
export class SlideOverComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('slideOverHost', { read: ViewContainerRef }) host: ViewContainerRef;
  @HostBinding('@slideOverState') slideOverState = '';
  private _openingDirection: SlideOverOpeningDirection;
  extraClasses: string[] = [];
  private _instanceToken: string;
  private _panelClosing: Subject<string> = new Subject();

  constructor(
    private _elementRef: ElementRef,
    private _virtualKeyBoard: KeyboardInternalService,
    private _minimumNeededConf: MinimumNeededConfiguration
  ) { }

  ngOnInit() {
    const el = this._elementRef.nativeElement as HTMLElement;

    // inicializo los extraClasses
    if (this.extraClasses.length == 0) {
      let colStyles: string =
        GenericHelper.getStylesConfigByWidthPrecentage(this._minimumNeededConf.auxiliaryPanelsDefaultConfiguration.widthPercentage);
      /*190618 Añadimos las clases col-n-n como clases extra.*/
      this.extraClasses = ['tpv-slide-over', 'noP'];
      // algunas veces la cadena viene con undefined por eso la limpio de ellos
      colStyles = colStyles.replace('undefined', '');
      // introduzclo las clases una por una al array
      colStyles.split(' ').forEach(item => this.extraClasses.push(item));
    }

    if (this.extraClasses != undefined) {
      this.extraClasses.forEach(item => el.classList.add(item));
    }

    window.addEventListener('resize', () => this._setHostHeight());
    window.addEventListener('fullscreenchange', () => this._setHostHeight());

    // Al inicio slide cerrado (así se diferencia la animación)
    this.close();
  }

  ngAfterViewInit() {
    // NOTA: hack timeout para ejecutar funciones estando ya renderizado el HTML
    // se abre slide ya construido con animación, timeout para evitar error en la consola
    setTimeout(() => {
      this.open();
      this._setHostHeight();
    }, 0);
  }

  ngOnDestroy() {
    this.host.clear();
    this._panelClosing.complete();
  }

  set instanceToken(token: string) {
    this._instanceToken = token;
  }

  set onInternalPanelFinished(intenalPanelClosing: Observable<any>) {
    intenalPanelClosing.subscribe(_ => this._panelClosing.next(this._instanceToken));
  }

  set openingDirection(direction: SlideOverOpeningDirection) {
    this._openingDirection = direction;
  }

  onReadyToClose(): Observable<any> {
    return this._panelClosing.asObservable();
  }

  set zIndex(value: number) {
    (<HTMLElement>this._elementRef.nativeElement).style.zIndex = value.toString();
  }

  // cierra el panel por un lado u otro según la configuración
  close() {
    if (this.openingDirection === SlideOverOpeningDirection.leftToRight) {
      this.slideOverState = 'closedLeft';
      this._virtualKeyBoard.CloseKeyBoard();
    } else {
      this.slideOverState = 'closedRight';
      this._virtualKeyBoard.CloseKeyBoard();
    }
  }

  // abre el panel siempre del mismo modo
  open() {
    this.slideOverState = 'opened';
  }

  /* NOTA: Hay que calcular la altura del panel en base a la altura de la pantalla
  y los elementos circundantes como las tabs y las cabeceras */
  /* TODO: de momento se calcula en base a la altura de TPV-ACTIONS porque
  el panel va anclado a este componente pero puede estar anclado a otro
  luego debería revisarse para que no siempre lo haga con tpv-actions
  (no se hace en base a TPV-SLIDE-OVER porque mientras se crea el componente
  detecta su altura con un error de unos 20px aproximadamente) */
  private _setHostHeight() {
    /*Fijado para ver en que parte de configuración deberia hacer*/
    //const currentItem = this._minimumNeededConf.layoutConfigurationRootItem as LayoutAreaItemStackContainer;
    const calcHeight = 88.5; //currentItem.itemList[1].heightPercentage;
    const calcTop = 100 - 88.5; //currentItem.itemList[1].heightPercentage;
    const top: string = calcTop == 0 ? calcTop.toString() : 'calc(' + calcTop.toString() + '% - 18px)';
    const height: string = calcTop != 0 ? calcHeight - 3 + '%' : calcHeight - 5 + '%';

    (<HTMLElement>this._elementRef.nativeElement).style.height = height;
    (<HTMLElement>this._elementRef.nativeElement).style.top = top;
  }
}
