import { CriteriaType } from "app/shared/document-search/criteria-type.enum";

export interface OperatorIdCriteria {
    criteriaType : CriteriaType;
    idList: Array<string>;
}
