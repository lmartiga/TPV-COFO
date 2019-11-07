import { Document } from 'app/shared/document/document';
import { GetDocumentResponseStatuses } from 'app/shared/web-api-responses/get-document-response-statuses.enum';

export interface GetDocumentResponse {
    status: GetDocumentResponseStatuses;
    message: string;
    document: Document;
}
