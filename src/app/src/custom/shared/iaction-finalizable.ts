import { Observable } from 'rxjs/Observable';
/**
 * Interfaz para componentes que se despliegan en ventana auxiliar.
 * T es el type del objeto que emitira al cerrarse (de haberlo)
 */
export interface IActionFinalizable<T> {
  onFinish(): Observable<T>;
  forceFinish(): void;
}
