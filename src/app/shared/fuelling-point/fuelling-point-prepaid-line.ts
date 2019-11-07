import { IbusinessSpecificLine } from 'app/shared/ibusiness-specific-line';
import { BusinessType } from 'app/shared/business-type.enum';
import { ConfirmPaymentRequest } from 'app/shared/confirm-payment-request';
import { FuellingPointPrepaidLineData } from 'app/shared/fuelling-point/fuelling-point-prepaid-line-data';
import { Observable } from 'rxjs/Observable';
import { Subscriber } from 'rxjs/Subscriber';
import { LogHelper } from 'app/helpers/log-helper';

export class FuellingPointPrepaidLine extends IbusinessSpecificLine {
    type: BusinessType = BusinessType.gasStation;

    constructor(
        private _data: FuellingPointPrepaidLineData,
        private  _logHelper: LogHelper
    ) {
        super();
    }
    /// representa el Id que devuelve el servidor para la transaccion
    private _idTransaction: string;

    onConfirmPay(request: ConfirmPaymentRequest): Observable<boolean> {
        return Observable.create((observer: Subscriber<boolean>) => {
            this._logHelper.trace('------> AUTORIZO FP');
            const data = this._data;

            if (request.ticketFactura == undefined || request.ticketFactura != true) {
            this._data.fpSvc.autorizeFuellingPoint(
                data.idFuellingPoint,
                request.seriesType,
                data.lineDetail,
                request.documentId,
                request.contactId,
                request.kilometers,
                request.vehicleLicensePlate)
                .first().subscribe(autorizeResponse => {
                    if (!autorizeResponse.success) {
                        return observer.next(false);
                    }
                    this._idTransaction = autorizeResponse.definitiveId;
                    observer.next(true);
                });
            }
            else {
                return observer.next(true);
            }
        });
    }

    onDeleteLine(): Observable<boolean> {
        this._logHelper.trace('------> LIBERO FP');
        return this._data.fpSvc.cancelLockingOfFuellingPoint(this._data.idFuellingPoint);
    }
    get idTransaction() {
        return this._idTransaction;
    }
}
