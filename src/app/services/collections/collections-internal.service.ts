import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { AuxiliarActionsManagerService } from 'app/services/auxiliar-actions/auxiliar-actions-manager.service';

@Injectable()
export class CollectionsInternalService {

  constructor(
    private _auxActionsManager: AuxiliarActionsManagerService
  ) {
  }

  collectPendingDocument(): Observable<boolean> {
    return this._auxActionsManager.collectPendingDocument();
  }

  collectRunaway(): Observable<boolean> {
    return this._auxActionsManager.collectRunawayDebt();
  }
}
