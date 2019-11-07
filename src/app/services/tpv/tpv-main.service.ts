import { Injectable } from '@angular/core';
import { Subject } from 'rxjs/Subject';

@Injectable()
export class TpvMainService {
    // PLU visible en el TPV
    private _pluVisible = new Subject<boolean>();

    setPluVisible$ = this._pluVisible.asObservable();
    constructor() {}

    // publica evento para quien se suscriba ponga la PLU visible
    setPluVisible(setPluVisible: boolean) {
        this._pluVisible.next(setPluVisible);
    }
}
