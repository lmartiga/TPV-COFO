import { Directive, ElementRef } from '@angular/core';
import { SlideOverService } from 'app/services/slide-over/slide-over.service';

@Directive({
  selector: '[tpvMainElement]'
})
export class MainElementDirective {

  constructor(
    elementRef: ElementRef,
    slideOver: SlideOverService
  ) {
    // Necesitamos tener la referencia del elemento 'main' en el servicio del slide over
    // para colocar el overlay colgando de ese elemento por defecto.
    slideOver.mainElement = elementRef.nativeElement as HTMLElement;
  }
}
