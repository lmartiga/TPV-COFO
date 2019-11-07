import { Document } from 'app/shared/document/document';
import { GetDocumentResponseStatuses } from 'app/shared/web-api-responses/get-document-response-statuses.enum';

export interface GetDocumentMassiveResponse {
    status: GetDocumentResponseStatuses;
    message: string;
    documents: Array<Document>;
}
