import { Document } from 'app/shared/document/document';


export interface ListDocumentResponse {
    status: number;
    message: string;
    ListDocument: Array<Document>;
}
