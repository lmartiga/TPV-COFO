/**
 * TODO: Pensar si cada slider abre su propio overlay o no, en cuyo caso igual no hay
 * que guardar las referencias del array.
 */

import { Injectable, ComponentFactoryResolver, ComponentRef, ViewContainerRef } from '@angular/core';
import { ComponentType } from '@angular/cdk/overlay';
import { SlideOverComponent } from 'app/components/slide-over/slide-over.component';
import { Guid } from 'app/helpers/guid';
import { OverlayService } from 'app/services/overlay/overlay.service';
import { IActionFinalizable } from 'app/shared/iaction-finalizable';
import { SlideOverOpeningDirection } from 'app/shared/slide-over/slide-over-opening-direction.enum';
import { LogHelper } from 'app/helpers/log-helper';

@Injectable()
export class SlideOverService {
  /**
   * Array de refencias.
   * Son objetos con las referencias de los componentes utilizados
   * para mostrar cada SlideOver
   * @private
   * @type {SlideOverInstance[]}
   * @memberof SlideOverService
   */
  private _attachedSlideOverInstances: SlideOverInstance[] = [];
  private _referencePanel: ViewContainerRef;
  private _mainElement: HTMLElement;
  private _nextOverlayZindex = 1000;
  private _openingDirection: SlideOverOpeningDirection;

  constructor(
    private _factoryResolver: ComponentFactoryResolver,
    private _overlay: OverlayService,
    private  _logHelper: LogHelper
  ) {
    this._overlay.onClick().subscribe(ev => {
      const target = (ev.target || ev.srcElement || ev.currentTarget) as Element;
      this.forceCloseSlideOver(target.id);
    });
  }

  /**
   *
   *
   * @template T type of the component to insert inside the slide over
   * @param {ComponentType<T>} component component to insert inside the slide over
   * @param {boolean} [withOverlay=true]
   * @returns {ComponentRef<T>} The reference to the custom component inside the SildeOver.
   * @memberof SlideOverService
   */
  openFromComponent<T>(
    component: ComponentType<T>,
    withOverlay: boolean = true,
    overlayCustomClasses: string[] = [],
    slideOverExtraClasses: string[] = [], blnVisibilityFuelling: boolean = false): ComponentRef<T> {

    if (this._referencePanel == undefined) {
      throw new Error('ERROR: No se ha asignado correctamente la referencia de la vista donde tiene que ir el slider solicitado');
    }

    let uniqueOverlayId: string;
    const nextOverlayZindex = this._getNextOverlayZindex();
    if (withOverlay === true) {
      if (overlayCustomClasses != undefined && overlayCustomClasses.length > 0) {
        uniqueOverlayId = this._overlay.create(nextOverlayZindex, this._mainElement, overlayCustomClasses, blnVisibilityFuelling);
      } else {
        uniqueOverlayId = this._overlay.create(nextOverlayZindex, this._mainElement, undefined, blnVisibilityFuelling);
      }
    }

    const key = Guid.newGuid();
    const attachedComponentRef: { customComponentRef: ComponentRef<any>, slideOverComponentRef: ComponentRef<any> } =
      this._attachComponent(component, key, nextOverlayZindex + 1, slideOverExtraClasses);

    this._attachedSlideOverInstances.push({
      key: key,
      overlayId: uniqueOverlayId,
      slideOverInternalComponentRef: attachedComponentRef.customComponentRef,
      slideOverRef: attachedComponentRef.slideOverComponentRef
    });

    return attachedComponentRef.customComponentRef;
  }
  modifySlideOverMarginLeft(tamaño: string) {
    this._overlay.modifyMarginLeft(tamaño);
  }

  get referencePanel(): ViewContainerRef {
    return this._referencePanel;
  }

  /**
   *
   * ViewContainerRef where all sliders should be created.
   * @memberof SlideOverService
   */
  set referencePanel(value: ViewContainerRef) {
    this._referencePanel = value;
    this._logHelper.trace('SlideOverService: Se ha asignado el viewContainerRef donde tienen que ir los sliders.');
  }

  set mainElement(element: HTMLElement) {
    this._mainElement = element;
    this._logHelper.trace('SlideOverService: Se ha asignado el main element donde tiene que ir el overlay por defecto.');
  }

  set openingDirection(direction: SlideOverOpeningDirection) {
    this._openingDirection = direction;
    this._logHelper.trace('SlideOverService: Se ha asignado la dirección en la que se abrirá y cerrará el panel.');
  }

  /**
   *
   * @private
   * @template T
   * @param {ComponentType<T>} component the type of the component to insert inside the slider.
   * @param {string} slideOverInstanceToken unique token to identify the future slide over component
   * @returns {{ 'customComponentRef': ComponentRef<any>, 'slideOverComponentRef': ComponentRef<any> }}
   * // returns an object containing the references to the newly created slide over and its custom component
   * @memberof SlideOverService
   */
  private _attachComponent(
    component: ComponentType<any>,
    slideOverInstanceToken: string,
    zIndex: number,
    slideOverExtraClasses: string[]): { 'customComponentRef': ComponentRef<any>, 'slideOverComponentRef': ComponentRef<any> } {

    // Create the slide over component
    const slideOverComponentFactory = this._factoryResolver.resolveComponentFactory(SlideOverComponent);
    const slideOverComponentRef = this.referencePanel.createComponent(slideOverComponentFactory);
    slideOverComponentRef.instance.instanceToken = slideOverInstanceToken;
    slideOverComponentRef.instance.zIndex = zIndex;
    slideOverComponentRef.instance.extraClasses = slideOverExtraClasses;
    slideOverComponentRef.instance.openingDirection = this._openingDirection;

    // Create the custom component inside slide over component
    const customComponentfactory = this._factoryResolver.resolveComponentFactory(component);
    const customComponentRef = slideOverComponentRef.instance.host.createComponent(customComponentfactory);

    const customComponentInstance = customComponentRef.instance as IActionFinalizable<any>;
    slideOverComponentRef.instance.onInternalPanelFinished = customComponentInstance.onFinish();
    slideOverComponentRef.instance.onReadyToClose().subscribe(token => {
      this._logHelper.trace(`Se recibe el evento de cierre del SlideOver con token: ${token}`);
      this._closeSlideOverByToken(token);
    });

    this._logHelper.trace('Se crea componente SildeOver con componente:');
    this._logHelper.trace(`${component.toString()}, z-index: ${zIndex} y token: ${slideOverInstanceToken}`);

    return { customComponentRef, slideOverComponentRef };
  }

  private forceCloseSlideOver(overlayId: string) {
    const sliderTarjeta = document.getElementsByClassName('tpv-credit-card');
    const sliderFidelizacion = document.getElementsByClassName('tpv-confirm-action-slide-static');
    if (sliderTarjeta[0] == undefined && sliderFidelizacion[0] == undefined) {
      const slideOverInstance = this._attachedSlideOverInstances.find(it => it.overlayId == overlayId);
      if (slideOverInstance != undefined) {
        this._logHelper.trace(`Se recibe cierre slideover`);
        this._logHelper.trace(`Se recibe cierre slideover: ${slideOverInstance.slideOverInternalComponentRef.componentType.name}`);
        if ((slideOverInstance.slideOverInternalComponentRef.componentType.name !== 'CreditCardPaymentComponent'
          && slideOverInstance.slideOverInternalComponentRef.componentType.name !== 'ConfirmActionSlideStaticComponent'
          && slideOverInstance.slideOverInternalComponentRef.instance._onCreditCardPayment !== true)
          || (slideOverInstance.slideOverInternalComponentRef.componentType.name !== 'CreditCardPaymentComponent'
            && slideOverInstance.slideOverInternalComponentRef.componentType.name !== 'ConfirmActionSlideStaticComponent')) {
          this._logHelper.trace(`Se cierra slideover`);
          const customComponentInstance = slideOverInstance.slideOverInternalComponentRef.instance as IActionFinalizable<any>;
          customComponentInstance.forceFinish();
          // No llamamos al cierre del slider porque ya estamos suscritos al evento onReadyToClose que lo intentará cerrar
        }
      }
    }
    else {
      this._logHelper.trace('La pantalla es de Fideliación o la de Tarjeta NO SE CIERRA');
    }
  }

  private _closeSlideOverByToken(token: string) {
    const slideOverInstance = this._attachedSlideOverInstances.find(it => it.key == token);
    this._closeSlideOver(slideOverInstance);
  }

  private _closeSlideOver(slideOver: SlideOverInstance) {
    if (slideOver != undefined) {
      this._overlay.close(slideOver.overlayId);
      slideOver.slideOverRef.instance.close();
      setTimeout(() => {
        slideOver.slideOverRef.destroy();
      }, 500);

      const indexToRemove = this._attachedSlideOverInstances.indexOf(slideOver);
      if (indexToRemove > -1) {
        this._attachedSlideOverInstances.splice(indexToRemove, 1);
      }
      this._nextOverlayZindex = this._nextOverlayZindex - 1000;
    }
  }

  private _getNextOverlayZindex() {
    const output = this._nextOverlayZindex;
    this._nextOverlayZindex = this._nextOverlayZindex + 1000;
    return output;
  }

  // cerrar el slider desde el angular
  _CloseSlider() {
    const slider = document.getElementsByClassName('tpv-overlay');
    if (slider[0]) {this.forceCloseSlideOver((slider[0] as HTMLElement).id); }
  }
}

// Esta interfaz está definida aquí porque es un artefacto interno de este servicio
export interface SlideOverInstance {
  key: string;
  overlayId?: string;
  slideOverRef: ComponentRef<SlideOverComponent>;
  slideOverInternalComponentRef: ComponentRef<any>;
}
