import { Directive, ElementRef, HostListener, Input, OnInit, Output, OnDestroy, EventEmitter } from '@angular/core';
import { KeyboardInternalService } from 'app/services/keyboard/keyboard-internal.service';
import { NgModel } from '@angular/forms';
import { Subscription } from 'rxjs/Subscription';
import { GenericHelper } from 'app/helpers/generic-helper';

@Directive({
  selector: '[tpvKeyboard]',
  providers: [NgModel]
})
export class KeyboardDirective implements OnInit, OnDestroy {
  // en el futuro será el tipo de teclado que quiero abrir
  @Input() type: string;
  @Output() enter: EventEmitter<boolean> = new EventEmitter();
  private _position: number;
  private _subscriptions: Subscription[] = [];
  disabledPosition: string[][] = [];

  constructor
    (private element: ElementRef,
      private keyboardInternalSrv: KeyboardInternalService,
      private ngModel: NgModel
    ) { }

  ngOnInit() {
    this.disabledPosition[1] = ['3', '4', '5', '6', '7', '8', '9'];
  }
  ngOnDestroy() {
    this._subscriptions.forEach(s => s.unsubscribe());
    this._hideKeyboard();
  }
  // cuando recibo el evento del click
  @HostListener('click')
  onclick() {
    this.element.nativeElement.select();
    this._position = this.element.nativeElement.selectionStart;
    if (this.element.nativeElement.selectionStart === null && this.type === 'Time') {
      this._position = 1;
    }
    this._openKeyboard();
    // envio la posición del puntero dentro del input
    this.keyboardInternalSrv.SendPosition(this._position);
  }

  @HostListener('blur', ['$event'])
  private _hideKeyboard() {
    this.keyboardInternalSrv.CloseKeyBoard();
  }

  private _openKeyboard() {
    // muestro el teclado por pantalla
    this.keyboardInternalSrv.ShowKeyBoard();
    // envio el ng-model del input al teclado y su tipo
    this.keyboardInternalSrv.SendNgModel(this.ngModel);
    // envio el ElementRef para lanzar el enter del teclado
    this.keyboardInternalSrv.SendElementRef(this.element);
    // envio el typo del input
    this.keyboardInternalSrv.SendType(this.element.nativeElement.type + '-' + this.element.nativeElement.id);

    GenericHelper._fnLocationKeyboard();

    if (this.element.nativeElement.selectionStart === null && this.type === 'Time') {
      this.SetStatusButton(' ');
    } else if (this.type !== 'text' && document.querySelector('.key-1') !== undefined) {
      this.ActivedAllButton();
    }
  }

  ActivedAllButton() {
    for (let index = 1; index <= 9; index++) {
      const div: Element = document.querySelector('.key-' + index);
      if (div !== undefined && div !== null) {
        const button = div.children[0];

        if (button !== undefined && button !== null) {
          button.removeAttribute('Disabled');
        }
      }
    }
  }

  SetStatusButton(value: string) {
    this.disabledPosition[1].forEach(disa => {
      if (value != ' ') {
        this.DisabledButton(disa);
      }
    });
  }

  DisabledButton(position: string) {
    const div: Element = document.querySelector('.key-' + position);
    if (div !== undefined && div !== null) {
      const button = div.children[0];

      if (button !== undefined && button !== null) {
        button.setAttribute('Disabled', 'true');
      }

    }
  }

  @HostListener('keydown', ['$event'])
  onkeydown(event: KeyboardEvent) {
    this.keyboardInternalSrv.ShowEventKeyPress(event.key);
  }

  @HostListener('keyup', ['$event'])
  onkeyup(event: KeyboardEvent) {
    this.keyboardInternalSrv.ShowEventKeyUp(event.key);
  }

}

