import { Document } from 'app/shared/document/document';
import { TMEGetInfoBillResponseStatuses } from 'app/shared/hubble-pos-signalr-responses/tme-get-info-ticket-to-bill-response-statuses.enum';
import { DocumentLine } from '../document/document-line';

export interface TMEGetInfoBillResponse {
  status: TMEGetInfoBillResponseStatuses;
  message: string;
  objDocumentResponse: Document;
  objDocumentLineResponse: DocumentLine;
}
