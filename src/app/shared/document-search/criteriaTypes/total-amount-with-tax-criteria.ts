import { CriteriaType } from "app/shared/document-search/criteria-type.enum";

export interface TotalAmountWithTaxCriteria {
    criteriaType : CriteriaType;
    to?: number;
    from?: number;
}
