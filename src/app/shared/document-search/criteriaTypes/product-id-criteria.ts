import { CriteriaType } from "app/shared/document-search/criteria-type.enum";

export interface ProductIdCriteria {
    criteriaType : CriteriaType;
    idList: Array<string>;
}
