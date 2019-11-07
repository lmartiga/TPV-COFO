import {endSaleType} from 'app/shared/endSaleType';

// tslint:disable-next-line:class-name
export interface changedPayment {
    selectedIndex: number;
    typeCall: number;
    isTicket: boolean;
    ticket: string;
    total: number;
    isCharged: boolean;
    totalChange: number;
    changePend: number;
    customerId: string;
    isStop: boolean;
    counterSecond: number;
    isButtonHidden: boolean;
    isButtonTicket: boolean;
    isButtonFactura: boolean;
    paymentType?: endSaleType;
    isEnabledButtom?: boolean;
}
