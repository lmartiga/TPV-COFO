export enum CriteriaType {
    // Criterio de búsqueda por identificador del cliente
    customerId = 1,
    // Criterio de búsqueda por nombre (razón social) del cliente
    customerBusinessName = 2,
    // Criterio de búsqueda por número de documento
    documentNumber = 3,
    // Criterio de búsqueda por fecha-hora de emisión
    emissionDateTime = 4,
    // Criterio de búsqueda por identificador del operador
    operatorId = 5,
    // Criterio de búsqueda por matrícula en los detalles de pago
    paymentDetailPlate = 6,
    // Criterio de búsqueda por identificador de medio de pago
    paymentMethodId = 7,
    // Criterio de búsqueda por identificador de producto
    productId = 8,
    // Criterio de búsqueda por total del documento con impuestos incluidos
    totalAmountWithTax = 9
}
