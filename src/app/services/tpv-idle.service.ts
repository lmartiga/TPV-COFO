import { Injectable, EventEmitter } from '@angular/core';
import { Idle, DEFAULT_INTERRUPTSOURCES } from '@ng-idle/core';

import { DocumentInternalService } from 'app/services/document/document-internal.service';
import { LogHelper } from 'app/helpers/log-helper';
@Injectable()
export class TpvIdleService {
  // Emito señal de entrada en Idle
  onIdleStart: EventEmitter<any> = new EventEmitter();
  // establece si esta idle (no tiene documentos activos y tiempo de espera)
  private isInIddle: boolean = false;
  constructor(private idle: Idle,
    private _docInternalSvc: DocumentInternalService,
    private  _logHelper: LogHelper) {
    this._logHelper.trace('IDLE SERVICE ON');

    this.idle.setTimeout(false);
    // sets the default interrupts, in this case, things like clicks, scrolls, touches to the document
    this.idle.setInterrupts(DEFAULT_INTERRUPTSOURCES);

    this.idle.onIdleEnd.subscribe(() => {
      if (this.isInIddle) {
        this.isInIddle = false;
      }
    });

    this.idle.onIdleStart.subscribe(() => {
      if (!this._docInternalSvc.hasAnyDocumentWithLine()) {
        this.isInIddle = true;
        this.onIdleStart.emit();
      }
    });

  }
  get isInIdle(): boolean {
    return this.isInIddle;
  }

  start(seconds: number = 60): void {
    this.idle.setIdle(seconds);
    this.idle.watch();
  }

}
