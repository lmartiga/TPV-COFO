import { Injectable } from '@angular/core';
import { HttpService } from '../http/http.service';
import { TMEButtonExactoResponse } from 'app/shared/hubble-pos-signalr-responses/tme-button-exacto-response';
import { AppDataConfiguration } from 'app/config/app-data.config';
import { TMEButtonTarjetaResponse } from 'app/shared/hubble-pos-signalr-responses/tme-button-tarjeta-response';
import { TMEButtonMixtoResponse } from 'app/shared/hubble-pos-signalr-responses/tme-button-mixto-response';
import { TMEButtonRefundFuelResponse } from 'app/shared/hubble-pos-signalr-responses/tme-button-refund-fuel-response';
import { TMEButtonRefundCompleteResponse } from 'app/shared/hubble-pos-signalr-responses/tme-button-refund-complete-response';
import { TMEGetInfoBillResponse } from 'app/shared/hubble-pos-signalr-responses/tme-get-info-ticket-to-bill-response';
import { TMEButtonFacturarResponse } from 'app/shared/hubble-pos-signalr-responses/tme-button-facturar-response';
import { TMEButtonCanjeCodigoBarrasResponse } from 'app/shared/hubble-pos-signalr-responses/tme-button-canje-codigo-barras-response';
import { TMEButtonCierreResponse } from 'app/shared/hubble-pos-signalr-responses/tme-button-cierre-response';
// import { SignalRTMEService } from '../signalr/signalr-tme.service';

@Injectable()
export class TmeService {
  private tmeOcupado: boolean = false;
  constructor(private _appDataConfig: AppDataConfiguration,
    private _http: HttpService,
    // private _signalRTMEService: SignalRTMEService
    ) { }

  async TMEButtonExacto(document: any, numLinePrepaid: number): Promise<TMEButtonExactoResponse> {
    const request = {
      ObjDocument: document,
      iNumberLinePrepaid: numLinePrepaid
    };
    const response: TMEButtonExactoResponse = await this._http.postJsonPromiseAsync(`${this._appDataConfig.apiUrl}/TMEButtonExacto`, request);
    return response;
  }

  async TMEButtonTarjeta(document: any, numLinePrepaid: number): Promise<TMEButtonTarjetaResponse> {
    const request = {
      ObjDocument: document,
      iNumberLinePrepaid: numLinePrepaid
    };
    const response: TMEButtonTarjetaResponse = await this._http.postJsonPromiseAsync(`${this._appDataConfig.apiUrl}/TMEButtonTarjeta`, request);
    return response;
  }

  async TMEButtonMixto(document: any, numLinePrepaid: number): Promise<TMEButtonMixtoResponse> {
    const request = {
      ObjDocument: document,
      iNumberLinePrepaid: numLinePrepaid
    };
    const response: TMEButtonMixtoResponse = await this._http.postJsonPromiseAsync(`${this._appDataConfig.apiUrl}/TMEButtonMixto`, request);
    return response;
  }

  async TMEButtonMixtoEfectivo(document: any, numLinePrepaid: number): Promise<TMEButtonMixtoResponse> {
    const request = {
      ObjDocument: document,
      iNumberLinePrepaid: numLinePrepaid
    };
    const response: TMEButtonMixtoResponse = await this._http.postJsonPromiseAsync(`${this._appDataConfig.apiUrl}/TMEButtonMixtoEfectivo`, request);
    return response;
  }

  async TMEButtonRefundFuel(document: any, strOperatorCode: string): Promise<TMEButtonRefundFuelResponse> {
    const request = {
      ObjDocument: document,
      strOperatorCode: strOperatorCode
    };
    const response: TMEButtonRefundFuelResponse = await this._http.postJsonPromiseAsync(`${this._appDataConfig.apiUrl}/TMEButtonRefundFuel`, request);
    return response;
  }

  async TMEButtonRefundComplete(document: any, strOperatorCode: string): Promise<TMEButtonRefundCompleteResponse> {
    const request = {
      ObjDocument: document,
      strOperatorCode: strOperatorCode
    };
    const response: TMEButtonRefundCompleteResponse =
      await this._http.postJsonPromiseAsync(`${this._appDataConfig.apiUrl}/TMEButtonRefundComplete`, request);
    return response;
  }

  async TMEButtonFacturar(strTMEGetInfoBillResponse: any): Promise<TMEButtonFacturarResponse> {
    const request = {
      strTMEGetInfoBillResponse: strTMEGetInfoBillResponse
    };
    const response: TMEButtonFacturarResponse = await this._http.postJsonPromiseAsync(`${this._appDataConfig.apiUrl}/TMEButtonFacturar`, request);
    return response;
  }

  async TMEGetInfoTicketToBill(strOperatorCode: string, strDocumentNumberToBill: string): Promise<TMEGetInfoBillResponse> {
    const request = {
      strOperatorCode: strOperatorCode,
      strDocumentNumberToBill: strDocumentNumberToBill
    };
    const response: TMEGetInfoBillResponse = await this._http.postJsonPromiseAsync(`${this._appDataConfig.apiUrl}/TMEGetInfoTicketToBill`, request);
    return response;
  }

  async TMEButtonCanjeCodigoBarras(document: any): Promise<TMEButtonCanjeCodigoBarrasResponse> {
    const request = {
      ObjDocument: document
    };
    const response: TMEButtonCanjeCodigoBarrasResponse =
      await this._http.postJsonPromiseAsync(`${this._appDataConfig.apiUrl}/TMEButtonCanjeCodigoBarras`, request);
    return response;
  }

  async TMEButtonCierre(tipoCierre: number): Promise<TMEButtonCierreResponse> {
    const request = {
      tipoCierre: tipoCierre
    };
    const response: TMEButtonCierreResponse = await this._http.postJsonPromiseAsync(`${this._appDataConfig.apiUrl}/TMEButtonCierre`, request);
    return response;
  }

  public setTMEOcupado(ocupado: boolean) {
    this.tmeOcupado = ocupado;
    // this._signalRTMEService.setStatusConnection(ocupado);

  }

  public getTMEOcupado(): boolean {
    if (this.tmeOcupado === undefined) {
      return false;
    } else {
      return this.tmeOcupado;
    }
  }
}
