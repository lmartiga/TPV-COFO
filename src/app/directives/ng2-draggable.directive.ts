import { Directive, ElementRef, HostListener, Input, OnInit, AfterViewInit } from '@angular/core';
import { GenericHelper } from 'app/helpers/generic-helper';

@Directive({
  selector: '[tpvNg2Draggable]'
})
export class DraggableDirective implements OnInit, AfterViewInit {
  topStart: number = 0;
  leftStart: number = 0;
  _allowDrag: boolean = true;
  md: boolean;
  _width: number;
  _height: number;
  private _allowDragInitial: boolean = false;

  constructor(public element: ElementRef) {
  }
  ngAfterViewInit() {

    if (this._width <= 800) {
      jQuery('.double').css('width', this._width - 20 + 'px');
      this.element.nativeElement.style.left = '10px';
      this.element.nativeElement.style.top = (this._height - jQuery('.virtual-keyboard').height() - 48 + 'px');
    } else {
      this.element.nativeElement.style.left = (this._width - jQuery('.virtual-keyboard').width() + 'px');
      this.element.nativeElement.style.top = (this._height - jQuery('.virtual-keyboard').height() - 48 + 'px');
    }

  }
  ngOnInit() {
    // css changes
    if (this._allowDrag) {
      // this.element.nativeElement.style.position = 'relative';
      this.element.nativeElement.className += ' cursor-draggable';
    }
    // anchura de la pantalla
    this._width = window.innerWidth
      || document.documentElement.clientWidth
      || document.body.clientWidth;
    // altura de la pantalla
    this._height = window.innerHeight
      || document.documentElement.clientHeight
      || document.body.clientHeight;
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
      // anchura de la pantall
      /*
      this._width = window.innerWidth
      || document.documentElement.clientWidth
      || document.body.clientWidth;
      // altura de la pantall
      this._height = window.innerHeight
      || document.documentElement.clientHeight
      || document.body.clientHeight;*/
      GenericHelper._fnLocationKeyboard();
      /*
      if (this._width <= 800) {
        jQuery('.double').css('width', this._width - 20 + 'px');
        this.element.nativeElement.style.left = '10px';
        this.element.nativeElement.style.top = (this._height - jQuery('.virtual-keyboard').height() - 48 + 'px');
      } else {
        jQuery('.double').removeAttr('style');
        this.element.nativeElement.style.left = (this._width - jQuery('.virtual-keyboard').width() + 'px');
        this.element.nativeElement.style.top = (this._height - jQuery('.virtual-keyboard').height() - 48 + 'px');
        }
        */
    }
  @HostListener('mousedown', ['$event'])
  onMouseDown(event: MouseEvent) {
      if (this._allowDragInitial == true) {
        if (event.srcElement.id == 'header' || event.srcElement.id == 'valueKeyboard' || event.srcElement.id == 'alphabetic-header' ||
          event.srcElement.id == 'numeric-header' || event.srcElement.id == 'numeric-drag-button-icon' ||
          event.srcElement.id == 'numeric-drag-button') {
            this._allowDrag = true;
          if (this.md !== undefined) {
            this.md = !this.md;
          } else {
            this.md = true;
          }
      this.topStart = event.clientY - this.element.nativeElement.style.top.replace('px', '');
      this.leftStart = event.clientX - this.element.nativeElement.style.left.replace('px', '');
    }
    else {
      this._allowDrag = false;
    }
    }
  }

  @HostListener('document:mouseup')
  onMouseUp(event: MouseEvent) {
    this.md = false;
  }

  @HostListener('document:mousemove', ['$event'])
  onMouseMove(event: MouseEvent) {
    if (this.md && this._allowDrag) {

      const a = event.clientY - this.topStart;
      const b = event.clientX - this.leftStart;

      const alturaTeclado = this.element.nativeElement.clientHeight;
      const anchuraTeclado = this.element.nativeElement.clientWidth;
      if (a >= 0 &&
        b >= 0 &&
        a < ((this._height) - alturaTeclado - 48) &&
        b < ((this._width) - anchuraTeclado )
      ) {
        this.element.nativeElement.style.top = (event.clientY - this.topStart) + 'px';
        this.element.nativeElement.style.left = (event.clientX - this.leftStart) + 'px';
      }
    }
  }

  @HostListener('touchstart', ['$event'])
  onTouchStart(event: TouchEvent) {
    if (this.md !== undefined) {
      this.md = !this.md;
    } else {
      this.md = true;
    }
    if (event.srcElement.id == 'header' || event.srcElement.id == 'numeric-header') {
      this.topStart = event.changedTouches[0].clientY - this.element.nativeElement.style.top.replace('px', '');
      this.leftStart = event.changedTouches[0].clientX - this.element.nativeElement.style.left.replace('px', '');
      event.stopPropagation();
    }
  }

  @HostListener('document:touchend')
  onTouchEnd() {
    this.md = false;
  }

  @HostListener('document:touchmove', ['$event'])
  onTouchMove(event: TouchEvent) {
    if (this._allowDragInitial == true) {
      if (event.srcElement.id == 'header' || event.srcElement.id == 'valueKeyboard' || event.srcElement.id == 'alphabetic-header' ||
      event.srcElement.id == 'numeric-header' || event.srcElement.id == 'numeric-drag-button-icon' ||
      event.srcElement.id == 'numeric-drag-button') {
      this._allowDrag = true;
      const a = event.changedTouches[0].clientY - this.topStart;
      const b = event.changedTouches[0].clientX - this.leftStart;

      const alturaTeclado = this.element.nativeElement.clientHeight;
      const anchuraTeclado = this.element.nativeElement.clientWidth;
      if (a >= 0 &&
        b >= 0 &&
        a < ((this._height) - alturaTeclado - 48) &&
        b < ((this._width) - anchuraTeclado)
      ) {
        this.element.nativeElement.style.top = (event.changedTouches[0].clientY - this.topStart) + 'px';
        this.element.nativeElement.style.left = (event.changedTouches[0].clientX - this.leftStart) + 'px';
      }
    }
    else {
      this._allowDrag = false;
    }
    event.stopPropagation();
  }
  }

  @Input('tpvNg2Draggable')
  set allowDrag(value: boolean) {
    this._allowDragInitial = value;
    this._allowDrag = value;
    if (this._allowDrag) {
      this.element.nativeElement.className += ' cursor-draggable';
    } else {
      this.element.nativeElement.className = this.element.nativeElement.className.replace(' cursor-draggable', '');
    }
  }
}
