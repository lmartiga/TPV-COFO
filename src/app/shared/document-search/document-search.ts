import { SearchDocumentMode } from 'app/shared/document-search/search-document-mode.enum';

export interface DocumentSearch {
    searchMode: SearchDocumentMode;
    document?: string;
    fromEmissionDate?: Date;
    toEmissionDate?: Date;
    plate?: string;
    customerId?: string;
    operator?: string;
    fromImport?: number;
    toImport?: number;
}
