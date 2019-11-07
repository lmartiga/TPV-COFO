import { Currency } from 'app/shared/currency/currency';
import { Volume } from 'app/shared/volume';

export interface FuellingPointFormatConfiguration {
    currency: Currency;
    volume: Volume;
    volumePipeFormat: string;
    moneyPipeFormat: string;
    unitPricePipeFormat: string;
    unitPriceSymbol: string;
}
