import { SearchDocument } from 'app/shared/web-api-responses/search-document';
import { SearchDocumentResponseStatuses } from 'app/shared/web-api-responses/search-document-response-statuses.enum';
import { UsageType } from 'app/shared/document-search/usage-type.enum';

export interface SearchDocumentResponse {
    status: SearchDocumentResponseStatuses;
    message: string;
    documentList: Array<SearchDocument>;
    searchMode: UsageType;
}
