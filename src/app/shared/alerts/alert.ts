import {AlertPurposeType} from 'app/shared/alerts/Alert-Purpose-Type.enum';
export interface Alert {
    id: number;
    title: string;
    message: string;
    purpose: AlertPurposeType;
    timesToBeShown: number;
    isRecurrent: boolean;
    operatorId: string;
    startDate?: Date;
    endDate?: Date;
    startTime?: Date;
    endTime?: Date;
    timesShownCounter: number;
}
