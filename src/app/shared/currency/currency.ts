import {CurrencyPriorityType} from 'app/shared/currency/currency-priority-type.enum';
export interface Currency {
    id: string;
    description: string;
    symbol: string;
    // TODO: fractionarySymbol se ha añadido para utilizarlo en el ayudante de cierres de caja.
    //       Debería completarse la información recibida para utilizarlo sin mockear. [€ -> 'cent']
    fractionarySymbol: string;
    decimalPositions: number;
    changeFactorFromBase: number;
    priorityType: CurrencyPriorityType;
}
