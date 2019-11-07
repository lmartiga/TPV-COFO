import { DocumentVirtualDoms } from 'app/shared/document/document-virtual-doms';

export interface DocumentVirtualInitialResponse {
    status: number;
    message: string;
    docVirtualList: Array<DocumentVirtualDoms>;
}
