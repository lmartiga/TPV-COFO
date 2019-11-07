import { Customer } from 'app/shared/customer/customer';
/**
 * Interfaz de respuesta para seleccion de cliente
 */
export interface CustomerSelectedResult {
    /**
     * cliente seleccionado (de haberlo)
     */
    customer: Customer;
    /**
     * indica si el cliente (de haberlo) ha sido seleccionado desde formulario de creacion (true) o si es existente (false)
     */
    isFromCreateForm: boolean;
    /**
     * informacion de matricula (de haberla).
     */
    plate?: string;
}
