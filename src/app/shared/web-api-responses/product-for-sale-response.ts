import { RateHistory } from 'app/shared/plu/rate-history';
import { ProductForSaleStatus } from 'app/shared/web-api-responses/product-for-sale-status.enum';


export interface ProductForSaleResponse {
    status: ProductForSaleStatus;
    message: string;
    productReference: string;
    productName: string;
    unitaryPricePreDiscount: number;
    unitaryPricePostDiscount: number;
    quantity: number;
    discountPercentage: number;
    discountedAmount: number;
    finalAmount: number;
    taxPercentage: number;
    rateHistory: Array<RateHistory>;
    typeArticle?: string;
    pricelocal?: number;
    /**
     *  Mensaje o información asociada al artículo.
        Típicamente se trata de algún aviso relacionado con el artículo que se le hace al operador que realiza la venta.
        Null si no hay mensaje.
     */
    productMessage: string;
    originalPriceWithTax: number;
    isConsigna?: boolean;
    coste?: number;
    modifPvp?: boolean;
}
