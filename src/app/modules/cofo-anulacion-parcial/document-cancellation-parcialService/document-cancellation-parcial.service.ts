import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { GetDocumentResponseList } from '../../../shared/web-api-responses/get-document-responseList';
import { HttpService } from '../../../services/http/http.service';
import { AppDataConfiguration } from '../../../config/app-data.config';
import {
  GetDocumentResponseStatuses
} from 'app/shared/web-api-responses/get-document-response-statuses.enum';
import { Subject } from 'rxjs/Subject';
import { LogHelper } from '../../../helpers/log-helper';
import { GetDocumentResponse } from '../../../shared/web-api-responses/get-document-response';
import { UsageType } from '../../../shared/document-search/usage-type.enum';
import { FormatHelper } from '../../../helpers/format-helper';
import { RoundPipe } from '../../../pipes/round.pipe';

@Injectable()
export class DocumentCancellationParcialService {

  private _documentListReasonsRequested: Subject<GetDocumentResponseList> = new Subject();

    constructor(
        private _httpSvc: HttpService,
        private _appDataConfig: AppDataConfiguration,
        private _roundPipe: RoundPipe,
        private _logHelper: LogHelper,
      ) { }

      SearchDocumentsToAnulled(fechaDesde: Date, fechaHasta: Date, importeDesde: number, importeHasta: number): Observable<GetDocumentResponseList> {
        const request = {
          Ncompany: this._appDataConfig.company.id,
          Ntpv: this._appDataConfig.userConfiguration.PosId,
          identity: this._appDataConfig.userConfiguration.Identity,
          FechaDesde: fechaDesde,
          fechaHasta: fechaHasta,
          ImporteDesde: importeDesde,
          ImporteHasta: importeHasta
        };
        this._httpSvc.postJsonObservable(`${this._appDataConfig.apiUrl}/SearchDocumentsToAnulled`, request)
          .first()
          .subscribe(
          (response: GetDocumentResponseList) => {
            if (response.status == GetDocumentResponseStatuses.Successful) {
              this._logHelper.trace(JSON.stringify(response.message));
              const filteredResponse: GetDocumentResponseList = response;
              this._documentListReasonsRequested.next(filteredResponse);
            } else {
              this._logHelper.trace(
                `La respuesta ha sido negativa: ${GetDocumentResponseStatuses[response.status]}. Mensaje: ${response.message}`);
              this._documentListReasonsRequested.next(undefined);
            }
          },
          error => {
            this._logHelper.trace(
              `Se produjo un error al solicitar la ejecución del servicio GetCashRecordTypes: ${error}`);
            this._documentListReasonsRequested.next(undefined);
          });
        return this._documentListReasonsRequested.asObservable();
      }

      getDocument(idDocument: string): Observable<GetDocumentResponse> {
          const request = {
          Identity: this._appDataConfig.userConfiguration.Identity,
          Id: idDocument,
          UsageType: UsageType.Rectify
        };
        return this._httpSvc.postJsonObservable(`${this._appDataConfig.apiUrl}/GetDocument`, request)
          .map((res: any) => {
            const ret: GetDocumentResponse = {
              status: res.status,
              message: res.message,
              document: FormatHelper.formatServiceDocument(res.document, this._roundPipe)
            };
            return ret;
          });
      }

      TraerReferenciasTicket(ticketNumber: string, tipo: string): Observable<GetDocumentResponseList> {
        const request = {
          Ncompany: this._appDataConfig.company.id,
          Ntpv: this._appDataConfig.userConfiguration.PosId,
          identity: this._appDataConfig.userConfiguration.Identity,
          ticketNumber: ticketNumber,
          tipo: tipo
        };
        this._httpSvc.postJsonObservable(`${this._appDataConfig.apiUrl}/TraerReferenciasTicket`, request)
          .first()
          .subscribe(
          (response: GetDocumentResponseList) => {
            if (response.status == GetDocumentResponseStatuses.Successful) {
              this._logHelper.trace(JSON.stringify(response.message));
              const filteredResponse: GetDocumentResponseList = response;
              this._documentListReasonsRequested.next(filteredResponse);
            } else {
              this._logHelper.trace(
                `La respuesta ha sido negativa: ${GetDocumentResponseStatuses[response.status]}. Mensaje: ${response.message}`);
              this._documentListReasonsRequested.next(undefined);
            }
          },
          error => {
            this._logHelper.trace(
              `Se produjo un error al solicitar la ejecución del servicio GetCashRecordTypes: ${error}`);
            this._documentListReasonsRequested.next(undefined);
          });
        return this._documentListReasonsRequested.asObservable();
      }
}

/* getAvailableCashRecordReasonsByCashboxRecordType(filter: CashboxRecordType): Observable<CashboxRecordReason[]> {
  const request = { identity: this._config.userConfiguration.Identity };
  this._http.postJsonObservable(`${this._config.apiUrl}/GetCashboxRecordReasons`, request)
    .first()
    .subscribe(
    (response: GetCashboxRecordReasonsResponse) => {
      if (response.status == GetCashboxRecordReasonsResponseStatuses.successful) {
        this._logHelper.trace(JSON.stringify(response.availableCashboxRecordReasons));
        const filteredResponse: CashboxRecordReason[] = response.availableCashboxRecordReasons.filter((item) => {
          return item.compatiblePurposes.includes(filter);
        });
        this._cashboxRecordReasonsRequested.next(filteredResponse);
      } else {
        this._logHelper.trace(
          `La respuesta ha sido negativa: ${GetCashboxRecordReasonsResponseStatuses[response.status]}. Mensaje: ${response.message}`);
        this._cashboxRecordReasonsRequested.next(undefined);
      }
    },
    error => {
      this._logHelper.trace(
        `Se produjo un error al solicitar la ejecución del servicio GetCashRecordTypes: ${error}`);
      this._cashboxRecordReasonsRequested.next(undefined);
    });
  return this._cashboxRecordReasonsRequested.asObservable(); */
