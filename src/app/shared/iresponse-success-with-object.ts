/**
 * Interfaz que sirve para devolver en funciones en las que haya que indicar si el proceso fue correcto y ademas un objeto.
 * Y asi evitar enviar objetos vacios.
 */
export interface IresponseSuccessWithObject<T> {
    success: boolean;
    object: T;
}
