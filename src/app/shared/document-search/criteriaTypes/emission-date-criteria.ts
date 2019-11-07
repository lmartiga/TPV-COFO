import { DateTimeType } from "app/shared/document-search/criteriaTypes/date-time-type.enum";
import { CriteriaType } from "app/shared/document-search/criteria-type.enum";

export interface EmissionDateCriteria {
    criteriaType : CriteriaType;
    from?: Date;
    to?: Date;
    type: DateTimeType;
}
