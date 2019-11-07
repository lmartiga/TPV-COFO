import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { Document } from 'app/shared/document/document';
import { SlideOverService } from 'app/services/slide-over/slide-over.service';
import { MixtPaymentComponent } from 'app/components/auxiliar-actions/mixt-payment/mixt-payment.component';
import { PaymentPurpose } from 'app/shared/payments/PaymentPurpose.enum';
import { SearchDocument } from 'app/shared/web-api-responses/search-document';
import { Customer } from 'app/shared/customer/customer';
import { MixtPaymentMultipleComponent } from 'app/src/custom/components/mixt-payment-multiple/mixt-payment-multiple.component';
import { LogHelper } from 'app/helpers/log-helper';

@Injectable()
export class MixtPaymentInternalService {
  constructor(
    private _slideOver: SlideOverService,
    private  _logHelper: LogHelper
  ) {
  }

  requestMixtPaymentSale(currentDocument: Document, paymentPurpose: PaymentPurpose, invoiceMandatory: boolean): Observable<boolean> {
    // No se puede invocar aquí al manager de acciones auxiliares porque compila con Warning de dependencia circular
    this._logHelper.trace('MixtPaymentInternalService-> Se solicita pago mixto');
    const componentRef = this._slideOver.openFromComponent(MixtPaymentComponent);
    componentRef.instance.setDocumentAndPaymentPurpose(currentDocument, paymentPurpose, invoiceMandatory);
    return componentRef.instance.onFinish();
  }

  requestMixtPaymentSaleMassive(currentDocuments: SearchDocument[], paymentPurposeMassive: PaymentPurpose,
     cliente: Customer): Observable<boolean> {
    // No se puede invocar aquí al manager de acciones auxiliares porque compila con Warning de dependencia circular
    this._logHelper.trace('MixtPaymentInternalService-> Se solicita pago mixto');
    const componentRef = this._slideOver.openFromComponent(MixtPaymentMultipleComponent);
    componentRef.instance.setDocumentsAndPaymentPurposeMassive(currentDocuments, paymentPurposeMassive, cliente);
    return componentRef.instance.onFinish();
  }
}
