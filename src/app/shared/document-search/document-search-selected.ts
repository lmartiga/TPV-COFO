import { UsageType } from 'app/shared/document-search/usage-type.enum';
import { Document } from 'app/shared/document/document';

export interface DocumentSearchSelected {
    usageType: UsageType;
    documentSelected: Document;

}

