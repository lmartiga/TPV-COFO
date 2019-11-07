import { CriteriaType } from 'app/shared/document-search/criteria-type.enum';

export interface CustomerIdCriteria {
    criteriaType: CriteriaType;
    idList: Array<string>;
}
