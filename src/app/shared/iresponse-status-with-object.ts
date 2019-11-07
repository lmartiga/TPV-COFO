import { ResponseStatus } from './response-status.enum';

/**
 * Interfaz que sirve para devolver en funciones en las que haya que indicar estado de la operacion
 * (ej: exito, cancelado, fallido) y ademas un objeto.
 * Y asi evitar enviar objetos vacios o undefined para simular estados
 */
export interface IresponseStatusWithObject<T> {
    status: ResponseStatus;
    object: T;
}
