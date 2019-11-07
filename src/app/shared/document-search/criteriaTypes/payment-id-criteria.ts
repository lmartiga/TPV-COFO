import { ExistenceType } from 'app/shared/document-search/criteriaTypes/existence-type.enum';
import { CriteriaType } from 'app/shared/document-search/criteria-type.enum';

export interface PaymentIdCriteria {
    criteriaType: CriteriaType;
    idList: Array<string>;
    existenceType: ExistenceType;
}
