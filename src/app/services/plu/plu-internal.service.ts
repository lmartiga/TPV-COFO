import { Injectable } from '@angular/core';
import { Subject, Observable } from 'rxjs';
// import { Subject } from 'rxjs/Subject';

@Injectable()
export class PluInternalService {

    constructor(
    ) {}

    private _disabledResetDocument: Subject<boolean> = new Subject<boolean>();

    disabledResetDocument(value: boolean) {
        this._disabledResetDocument.next(value);
    }

    listenerdisabledResetDocument(): Observable<boolean> {
        return this._disabledResetDocument.asObservable();
    }

    // TODO: DE MOMENTO NO HACE FALTA, COMENTAMOS POR SI ACASO
    // // poner el foco en el input de search
    // private _setInputSearchFocus = new Subject<boolean>();

    // setInputSearchFocus$ = this._setInputSearchFocus.asObservable();

    // // publica evento indicando que se ha de poner foco en el input
    // // de búsqueda de la PLU
    // setInputSearchFocus(setFocus: boolean) {
    //     this._setInputSearchFocus.next(setFocus);
    // }
}
