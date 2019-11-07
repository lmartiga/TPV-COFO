export interface DecimalPrecisionConfiguration {
  decimalPositionsForQuantities: number;
  decimalPositionsForUnitPricesWithTaxForShopProduct: number;
  decimalPositionsForUnitPricesWithTaxForTrackProduct: number;
  decimalPositionsForUnitPricesWithoutTax: number;
  decimalPositionsForUnitPricesForForecourtController: number;
  decimalPositionsForQuantitiesForForecourtController: number;
  decimalPositionsForDiscountPercentage: number;
  decimalPositionsForTaxPercentage: number;
  decimalPositionsByCurrencyId: Map<string, number>;
}
