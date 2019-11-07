import { ProductPriceLevelType } from 'app/shared/plu/product-price-level-type.enum';
import { ProductPriceRateType } from 'app/shared/plu/product-price-rate-type.enum';

export interface RateHistory {
    apply: boolean;
    rateValue: number;
    relativeOrder: number;
    rateLevel: ProductPriceLevelType;
    rateType: ProductPriceRateType;
}
