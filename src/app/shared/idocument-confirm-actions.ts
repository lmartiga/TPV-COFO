import { Observable } from 'rxjs/Observable';
import { Document } from 'app/shared/document/document';
/**
 * Clase que sirve como interfaz para servicio que efectuara operaciones al confirmar la 
 * creacion de un documento.
 */
export abstract class IdocumentConfirmActions {
    abstract onSendComplete(document: Document): Observable<boolean>;
}
