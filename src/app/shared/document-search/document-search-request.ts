import { UsageType } from "app/shared/document-search/usage-type.enum";
import { CriteriaRelationshipType } from "app/shared/document-search/criteria-relationship-type.enum";
import { PaymentPendingFilterType } from "app/shared/document-search/payment-pending-filter-type.enum";
import { ScopeType } from "app/shared/document-search/scope-type.enum";
import { OrderingFieldType } from "app/shared/document-search/ordering-field-type.enum";
import { OrderingDirectionType } from "app/shared/document-search/ordering-direction-type.enum";

export interface DocumentSearchRequest {
    identity: string;
    usageType: UsageType;
    criteriaList: Array<any>;
    criteriaRelationshipType: CriteriaRelationshipType;
    paymentPendingFilterType: PaymentPendingFilterType;
    scope: ScopeType;
    orderingField?: OrderingFieldType;
    orderingDirection?: OrderingDirectionType;
}

