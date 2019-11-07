import { Document } from 'app/shared/document/document';
import { GetDocumentResponseStatuses } from 'app/shared/web-api-responses/get-document-response-statuses.enum';

export interface GetDocumentResponseList {
    status: GetDocumentResponseStatuses;
    message: string;
    documentList: Array <Document>;
}
