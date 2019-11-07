import { Alert } from 'app/shared/alerts/alert';

export interface GetActiveAlertsResponse {
    status: number;
    message: string;

    alerts: Alert[];
}
