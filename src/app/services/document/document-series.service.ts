import { Injectable } from '@angular/core';
import { AppDataConfiguration } from 'app/config/app-data.config';
import { SeriesType } from 'app/shared/series/series-type';
import { FinalizingDocumentFlowType } from 'app/shared/document/finalizing-document-flow-type.enum';
import { Series } from 'app/shared/series/series';
import { FuncionalityMode } from 'app/shared/funcionality-mode.enum';
import { Subject } from 'rxjs/Subject';
import { Observable } from 'rxjs/Observable';


@Injectable()
export class DocumentSeriesService {
  private activeCleanCategories = new Subject<any>();

  constructor(
    private _appDataConfig: AppDataConfiguration
  ) {
  }

  getSeriesByFlow(flow: FinalizingDocumentFlowType, totalAmount: number): Series {
    let ret: Series;
    switch (flow) {
      case FinalizingDocumentFlowType.EmittingTicket:
        ret = this._getSeriesSellByTicket(totalAmount);
        break;
      case FinalizingDocumentFlowType.EmittingBill:
        ret = this.getSerieSellByBill(totalAmount);
        break;
      case FinalizingDocumentFlowType.EmittingCreditNoteForBill:
        ret = this.getSerieCreditNoteByBill();
        break;
      case FinalizingDocumentFlowType.EmittingCreditNoteForTicket:
        ret = this.getSerieCreditNoteByTicket();
        break;
      case FinalizingDocumentFlowType.EmittingDevolutionForBill:
        ret = this.getSerieDevolutionByBill();
        break;
      case FinalizingDocumentFlowType.EmittingDevolutionForTicket:
        ret = this.getSerieDevolutionByTicket();
        break;
      case FinalizingDocumentFlowType.EmittingDispatchNote:
        ret = this._getSeriesForDispatchNote();
        break;
      case FinalizingDocumentFlowType.EmittingDocumentForConsignment:
        ret = this._getSeriesForConsignment();
        break;
      default:
        break;
    }
    if (ret == undefined) {
      ret = this._appDataConfig.getSeriesByType(SeriesType.ticket);
    }
    return ret;
  }

  private _getSeriesSellByTicket(totalAmount: number): Series {
    let series: Series;
    const maxLimit = this._appDataConfig.maxAmountForTicketWithoutInvoice;
    if (totalAmount > maxLimit) {
      series = this._appDataConfig.getSeriesByType(SeriesType.invoice);
      if (series == undefined) {
        series = this._appDataConfig.getSeriesByType(SeriesType.ticket);
      }
      return series;
    } else if (totalAmount < 0) {
      switch (this._appDataConfig.rectifyingSeriesForStandardSaleFunctionalityMode) {
        case FuncionalityMode.ON:  // NEEDED: Empty values are Not allowed
          series = this._appDataConfig.getSeriesByType(SeriesType.rectifyingTicket);
          break;
        case FuncionalityMode.OFF: // DISABLED: This serie is not used. Always Change to standard series
          series = this._appDataConfig.getSeriesByType(SeriesType.ticket);
          break;
        case FuncionalityMode.OPTIONAL: // OPTIONAL: Change to standard only when Series has no value
          series = this._appDataConfig.getSeriesByType(SeriesType.rectifyingTicket);
          if (series == undefined) { // ticket rectificativo
            series = this._appDataConfig.getSeriesByType(SeriesType.ticket);
          }
          break;
        default:
          series = undefined;
          break;
      }
    } else {
      series = this._appDataConfig.getSeriesByType(SeriesType.ticket);
    }
    return series;
  }

  private getSerieSellByBill(totalAmount: number): Series {
    let series: Series;
    if (totalAmount >= 0) {
      series = this._appDataConfig.getSeriesByType(SeriesType.invoice);
    } else {
      series = this._appDataConfig.getSeriesByType(SeriesType.rectifyingInvoice);
    }
    return series;
  }

  private getSerieCreditNoteByBill(): Series {
    let series: Series;
    switch (this._appDataConfig.rectifyingSeriesForCreditNoteFunctionalityMode) {
      case FuncionalityMode.ON: // NEEDED: Empty values are Not allowed
        series = this._appDataConfig.getSeriesByType(SeriesType.rectifyingInvoice);
        if (series == undefined) {
          throw new Error('Serie rectificativa MANDATORY para factura no encontrada');
        }
        break;
      case FuncionalityMode.OFF: // DISABLED: This serie is not used. Always Change to standard series
        series = this._appDataConfig.getSeriesByType(SeriesType.invoice);
        break;
      case FuncionalityMode.OPTIONAL:
        series = this._appDataConfig.getSeriesByType(SeriesType.rectifyingInvoice);
        if (series == undefined) {
          series = this._appDataConfig.getSeriesByType(SeriesType.invoice);
        }
        break;
      default:
        series = undefined;
        break;
    }
    return series;
  }

  private getSerieCreditNoteByTicket(): Series {
    let series: Series;
    switch (this._appDataConfig.rectifyingSeriesForCreditNoteFunctionalityMode) {
      case FuncionalityMode.ON: // NEEDED: Empty values are Not allowed
        series = this._appDataConfig.getSeriesByType(SeriesType.rectifyingTicket);
        if (series == undefined) {
          throw new Error('Serie rectificativa MANDATORY para ticket no encontrada');
        }
        break;
      case FuncionalityMode.OFF:
        series = this._appDataConfig.getSeriesByType(SeriesType.ticket);
        break;
      case FuncionalityMode.OPTIONAL:
        series = this._appDataConfig.getSeriesByType(SeriesType.rectifyingTicket);
        if (series == undefined) {
          series = this._appDataConfig.getSeriesByType(SeriesType.ticket);
        }
        break;
      default:
        series = undefined;
        break;
    }
    return series;
  }

  private getSerieDevolutionByBill(): Series {
    let series: Series;
    // segun el parametro IsDevolutionACreditNote (bool) se toma un parametro u otro para la toma de decision.
    const switchVar = this._appDataConfig.isDevolutionAsCreditNote ?
      this._appDataConfig.rectifyingSeriesForCreditNoteFunctionalityMode : this._appDataConfig.rectifyingSeriesForInvoiceSaleFunctionalityMode;
    switch (switchVar) {
      case FuncionalityMode.ON:
        series = this._appDataConfig.getSeriesByType(SeriesType.rectifyingInvoice);
        if (series == undefined) {
          throw new Error('Serie rectificativa MANDATORY para factura no encontrada');
        }
        break;
      case FuncionalityMode.OFF:
        series = this._appDataConfig.getSeriesByType(SeriesType.invoice);
        break;
      case FuncionalityMode.OPTIONAL:
        series = this._appDataConfig.getSeriesByType(SeriesType.rectifyingInvoice);
        if (series == undefined) {
          series = this._appDataConfig.getSeriesByType(SeriesType.invoice);
        }
        break;
      default:
        series = undefined;
        break;
    }
    return series;
  }

  private getSerieDevolutionByTicket(): Series {
    let series: Series;
    // segun el parametro IsDevolutionACreditNote (bool) se toma un parametro u otro para la toma de decision.
    const switchVar = this._appDataConfig.isDevolutionAsCreditNote ?
      this._appDataConfig.rectifyingSeriesForCreditNoteFunctionalityMode : this._appDataConfig.rectifyingSeriesForStandardSaleFunctionalityMode;
    switch (switchVar) {
      case FuncionalityMode.ON:
        series = this._appDataConfig.getSeriesByType(SeriesType.rectifyingTicket);
        if (series == undefined) {
          throw new Error('Serie rectificativa MANDATORY para ticket no encontrada');
        }
        break;
      case FuncionalityMode.OFF:
        series = this._appDataConfig.getSeriesByType(SeriesType.ticket);
        break;
      case FuncionalityMode.OPTIONAL:
        series = this._appDataConfig.getSeriesByType(SeriesType.rectifyingTicket);
        if (series == undefined) {
          series = this._appDataConfig.getSeriesByType(SeriesType.ticket);
        }
        break;
      default:
        series = undefined;
        break;
    }
    return series;
  }

  private _getSeriesForDispatchNote(): Series {
    const dispatchNoteSerie = this._appDataConfig.getSeriesByType(SeriesType.dispatchNote);
    if (dispatchNoteSerie == undefined) {
      const errorMsg = 'No se ha configurado la serie para Dispatch Note';
      throw new Error(errorMsg);
    }
    return dispatchNoteSerie;
  }

  private _getSeriesForConsignment(): Series {
    return this._appDataConfig.getSeriesByType(SeriesType.consignment);
  }

  createCleanCategories(): Observable<any> {
    return this.activeCleanCategories.asObservable();
    }
  showCleanCategories() {
    this.activeCleanCategories.next({});
    }
}
