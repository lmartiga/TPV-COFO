import { Operator } from 'app/shared/operator/operator';
import { Currency } from 'app/shared/currency/currency';
import { CashboxRecordReasonOff } from './cashbox-record-off-Reason';
import { CashboxRecordTypeOffline } from './cashbox-record-offline-type.enum';
import { PaymentMethod } from 'app/shared/payments/payment-method';

export interface CashboxOnline {
    operadorId: Operator;
    operadorName: Operator;
    /* id: number; */
    idCaja: string;
    /*nanotacion: number; */
    tanotacion: CashboxRecordTypeOffline;
    fecha: string;
    importe: number;
    medio: PaymentMethod;
    descripcion: string;
    /* ndocumento: string;
    tdocumento: string;*/
    divisa: Currency;
    contabilizado: boolean;
    tapunte: CashboxRecordReasonOff;
    /* ndocumento_pro: string; */
    /* ntraspaso: string;
    cierre: string;*/
    porgasto: number;
    /*nbalance: string; */
    tienda: string;
    change_Currency: number;
    /*totalChange: number; */
    fechaNegocio: Date;
    online: boolean;
}


