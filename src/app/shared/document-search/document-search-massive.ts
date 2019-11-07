import { UsageType } from 'app/shared/document-search/usage-type.enum';
import { SearchDocument } from '../web-api-responses/search-document';
import { Customer } from '../customer/customer';

export interface DocumentSearchMassive {
    usageType: UsageType;
    documentsSelected: SearchDocument [];
    cliente: Customer;
}

