import { ActionType } from 'app/shared/electronic-journal/action-type.enum';
import { Injectable } from '@angular/core';
import { LogInternalService } from 'app/services/logger/log-internal.service';

@Injectable()
export class LogHelper {
  constructor(
     private _logInternal: LogInternalService
  ){}
  // TODO: MOCK!!!!
  public trace(text: any, tag: any= undefined, isWrite: boolean = true) {
    console.log(text);
    try {
      if (isWrite) {
        this._logInternal.fnWriteInfoLog({
          type: ActionType.Console_log,
          genericDetail: JSON.stringify(text),
        });
      }
    } catch (error) {
      // console.log('TEST_LOG',error);
      // console.log('TEST_LOG',text);
    }
  }

  public logError( text: any, tag: any = undefined, status: number = 0, isWrite: boolean = true) {
    console.error(text);
    try {
      if (isWrite) {
        this._logInternal.fnWriteInfoLog({
          type: ActionType.Console_error,
          genericDetail: JSON.stringify(text),
        });
      }
    } catch (error) {
      // console.log('TEST_LOG E',error);
      // console.log('TEST_LOG E',text);
    }

  }

}
