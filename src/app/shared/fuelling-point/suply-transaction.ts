import { FuellingLimitType } from 'app/shared/fuelling-point/fuelling-limit-type.enum';
import { ServiceModeType } from 'app/shared/fuelling-point/service-mode-type.enum';
import { SuplyTransactionType } from 'app/shared/fuelling-point/suply-transaction-type.enum';

export interface SuplyTransaction {
    // Identificador
    id: number;

    // Identificador del surtidor donde se generó la transacción
    fuellingPointId: number;

    // V
    type: SuplyTransactionType;

    gradeId: number;

    // Price of grade
    gradeUnitPrice: number;

    // Ilion reference of grade
    gradeReference: string;

    // Monetary amount served
    money: number;

    // Volume supplied
    volume: number;

    // Top value to reach in fuelling operation, if any
    fuellingLimitValue?: number;

    // Type of value to limit the fuelling operation, if any
    fuellingLimitType?: FuellingLimitType;

    // POS id that is actually locking this transaction.
    // Null if none.
    lockingPOSId?: number;

    // Tipo de modo de servicio.
    // Será "Otro" cuando el surtidor esté cerrado o sea uno distinto de los soportados
    serviceModeType: ServiceModeType;

    // Staring Date and time of supply
    startDateTime: Date;

    // Ending Date and time of supply
    finishDateTime: Date;

    // Variable para ver si es un suministro anulado
    anulated?: boolean;

    // Variable para ver si es un suministro virtual
    isVirtual?: boolean;

    // Variable para ver el nombre del suministro
    description?: string;

    // Variable para ver el tipo del producto
    typeArticle?: string;

    // Variable para ver el IVA del producto
    iva?: number;

    // Variable para ver si es un Suministro Anulado en Consigna
    isConsigna?: boolean;

    // Variable para el Ticket Original
    idMov?: string;

    // Variable para la Fecha del Suministro
    fecha?: Date;

    // Variable para Número de Boquerel
    nBoquerel?: string;

    // Variable para el Número de Tarjeta
    nTarjeta?: string;

    // Variable para el Código de la Tienda
    nTienda?: string;

    // Variable para Número de Surtidor
    nSurtidor?: string;

    // Variable para ver si es un suministro anulado ya en el ticket de un TPV
    enticket?: boolean;

    priceWithoutTax?: number;

}
