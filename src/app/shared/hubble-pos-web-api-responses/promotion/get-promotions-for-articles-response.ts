import { GetPromotionsForArticlesStatus } from './get-promotions-for-articles-status.enum';
import { IDictionaryStringKey } from 'app/shared/idictionary';
import { Promotion } from 'app/shared/promotion/promotion';

export interface GetPromotionsForArticlesResponse {
    status: GetPromotionsForArticlesStatus;
    message: string;
    promotionsForArticlesDictionary: IDictionaryStringKey<Array<Promotion>>;
}

