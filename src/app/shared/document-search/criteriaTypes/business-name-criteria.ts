import { TextMatchingType } from "app/shared/document-search/criteriaTypes/text-matching-type.enum";
import { CriteriaType } from "app/shared/document-search/criteria-type.enum";

export interface BusinessNameCriteria {
    criteriaType : CriteriaType;
    name:string;
    matchingType : TextMatchingType;
}
