import { IbusinessSpecificLine } from 'app/shared/ibusiness-specific-line';
import { BusinessType } from 'app/shared/business-type.enum';
import { FuellingPointsService } from 'app/services/fuelling-points/fuelling-points.service';
import { ConfirmPaymentRequest } from 'app/shared/confirm-payment-request';
import { Observable } from 'rxjs/Observable';
import { SuplyTransactionType } from 'app/shared/fuelling-point/suply-transaction-type.enum';
import 'rxjs/add/observable/of';
import { FuellingPointSupplyLineData } from './fuelling-point-supply-line-data';
import { Subscriber } from 'rxjs/Subscriber';
export class FuellingPointSupplyLine extends IbusinessSpecificLine {
    constructor(
        private data: FuellingPointSupplyLineData
    ) {
        super();
        this._fpSvc = data.fpSvc;
    }
    private _fpSvc: FuellingPointsService;
    /// representa el Id que devuelve el servidor para la transaccion
    private _idTransaction: string;
    type: BusinessType = BusinessType.gasStation;

    onConfirmPay(data: ConfirmPaymentRequest): Observable<boolean> {
        return Observable.create((observer: Subscriber<boolean>) => {
           // this._logHelper.trace('--> FINALIZO TRANSACCION');
            const transaction = this.data.supplyTransaction;

            // Verificacion
            if (transaction.anulated != true && !transaction.isVirtual) {
                this._fpSvc.getSupplyTransactionOfFuellingPoint(transaction.id,
                    transaction.fuellingPointId).first().subscribe(Response => {
                    if(Response){
                            if ( (transaction.anulated == undefined || transaction.anulated != true)
                            && (data.ticketFactura == undefined || data.ticketFactura != true) ) {
                            this._fpSvc.finalizeSupplyTransaction(transaction.id,
                                transaction.fuellingPointId,
                                data.documentId,
                                this.data.lineNumberInDocument,
                                this.data.contactId,
                                this.data.vehicleLicensePlate,
                                this.data.odometerMeasurement)
                                .first().subscribe(finalizeResponse => {
                                    if (!finalizeResponse.success) {
                                        return observer.next(false);
                                    }
                                    this._idTransaction = finalizeResponse.definitiveId;
                                    return observer.next(true);
                                });
                            }
                            else {
                                return observer.next(true);
                            } 
                    } else {
                            return observer.next(true);
                    } 
                });
            }else{
                return observer.next(true);
            }
        });
    }
    
    onDeleteLine(): Observable<boolean> {
        if (this.supplyTransaction.type == SuplyTransactionType.PrepaidParcialLockedByOwnPOS) {
            return Observable.of(true);
        }
      //  this._logHelper.trace('--> LIBERO TRANSACCION');
        return this._fpSvc.unlockSupplyTransaction(this.supplyTransaction.id, this.supplyTransaction.fuellingPointId);
    }

    get supplyTransaction() {
        return this.data.supplyTransaction;
    }

    get idTransaction() {
        return this._idTransaction;
    }
}
