export interface HubbleDocumentLine {
    /// Número de línea dentro del documento
    lineNumber: number;
    /// Identificador del producto
    productId: string;
    /// Nombre del producto
    productName: string;
    /// Cantidad o número de unidades del producto
    quantity: number;
    /// Precio unitario, con impuestos incluidos (y sin descuentos aplicados)
    unitaryPriceWithTax: number;
    /// Porcentaje de descuento aplicado
    discountPercentage: number;
    /// Valor monetario del descuento aplicado, con impuestos incluidos.
    discountAmountWithTax: number;
    /// Porcentaje de impuestos aplicado
    taxPercentage: number;
    /// Valor monetario de los impuestos aplicados
    taxAmount: number;
    /// Monto total de la línea, con impuestos incluidos (y descuentos aplicados)
    totalAmountWithTax: number;
}
