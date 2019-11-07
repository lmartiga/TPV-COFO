import { SetPrintingLiteralsResponseStatuses } from './set-printing-literals-response-statuses.enum';

export interface SetPrintingLiteralsResponse {
    status: SetPrintingLiteralsResponseStatuses;
    message: string;
}
