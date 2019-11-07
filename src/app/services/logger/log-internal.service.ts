import { Injectable } from '@angular/core';
import { Subject } from 'rxjs/Subject';
import { JournalAction } from 'app/shared/electronic-journal/journal-action';

@Injectable()
export class LogInternalService {

  private _infoLog: Subject<JournalAction> = new Subject();
  $infoLog = this._infoLog.asObservable();
  constructor() { }

  fnWriteInfoLog(journalAction: JournalAction) {
    this._infoLog.next(journalAction);
  }

}
