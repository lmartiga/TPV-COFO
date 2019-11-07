export enum OrderingFieldType {
    // Identificador del documento
    documentId = 1,
    // Identificador del cliente
    customerTIN = 2,
    // Nombre (razón social) del cliente
    customerBusinessName = 3,
    // Nombre del operador
    operatorName = 4,
    // Fecha local de emisión
    emissionLocalDateTime = 5,
    // Fecha UTC de emisión
    emissionUTCDateTime = 6,
    // Total del documento con impuestos incluidos
    totalAmountWithTax = 7
}
