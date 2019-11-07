import {
  CreateDocumentsResponseStatuses
} from 'app/shared/hubble-pos-web-api-responses/create-documents/create-documents-response-statuses.enum';

export interface CreateDocumentsResponse {
  status: CreateDocumentsResponseStatuses;
  message: string;

  provisionalToDefinitiveIdDictionary: Map<number, string>;
}
