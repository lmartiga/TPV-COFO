export enum PaymentPendingFilterType {
    // Todos los documentos. No filtrar por la condición de pendiente de pago
    noFilter = 0,
    // Excluir los documentos pendientes de pago
    excludePaymentPendingDocuments = 1,
    // Incluir sólo documentos pendientes de pago
    onlyPaymentPendingDocuments = 2
}
