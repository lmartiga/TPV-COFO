import { Component, OnInit } from '@angular/core';
import { IActionFinalizable } from 'app/shared/iaction-finalizable';
import { Subject } from 'rxjs/Subject';
import { Observable } from 'rxjs/Observable';
import { FuellingPointsService } from 'app/services/fuelling-points/fuelling-points.service';
import { SuplyTransaction } from 'app/shared/fuelling-point/suply-transaction';
import { FuellingPointsInternalService } from 'app/services/fuelling-points/fuelling-points-internal.service';
import { FuellingPointFormatConfiguration } from 'app/shared/fuelling-point/fuelling-point-format-configuration';
import { IDictionaryStringKey } from 'app/shared/idictionary';
import { LanguageService } from 'app/services/language/language.service';
import { ElectronicJournalService } from 'app/services/electronic-journal/electronic-journal.service';
import { ActionType } from 'app/shared/electronic-journal/action-type.enum';

@Component({
  selector: 'tpv-waiting-operations-auxiliar-panel',
  templateUrl: './waiting-operations-auxiliar-panel.component.html',
  styleUrls: ['./waiting-operations-auxiliar-panel.component.scss']
})
export class WaitingOperationsAuxiliarPanelComponent implements OnInit, IActionFinalizable<boolean> {

  private _onWaitingOperations: Subject<boolean> = new Subject();
  // configuracion de formatos
  formatConfig: FuellingPointFormatConfiguration;
  // used in view
  headerText: string = ''; //'Operaciones en espera';

  // receives all waiting opereations from service
  supplyTransactions: Array<SuplyTransaction>;
  supplyTransactionsAnulated: Array<SuplyTransaction>;


  constructor(
    private _fpSvc: FuellingPointsService,
    private _fpInternalSvc: FuellingPointsInternalService,
    private _languageService: LanguageService,
    private _electronicJournalService: ElectronicJournalService,
  ) {
    this.headerText = this.getLiteral('waiting_operations_auxiliar_component', 'header_PendingTransactions');
  }
  /**** IACTIONFINALIZABLE interface */
  onFinish(): Observable<boolean> {
    return this._onWaitingOperations.asObservable();
  }
  forceFinish(): void {
    this._onWaitingOperations.next(false);
  }
  /** end region iactionfinalizable interface*/
  ngOnInit() {
    this.formatConfig = this._fpInternalSvc.formatConfiguration;

    // getting full list of waiting operations
    this._fpSvc.requestSuplyTransactions()
      .first().subscribe(response => {
        this.supplyTransactions = response;
      },
        error => this._onWaitingOperations.next(false));
    /*
    this._fpSvc.requestSuplyTransactions()
      .first().subscribe(response => {
        this.supplyTransactions = response;
      }, error => {
        this._logHelper.trace('Error en la función requestSuplyTransactions', error);
      });
      */
    this._fpSvc.requestSuplyTransactionsAnulated()
      .first().subscribe(response => {
        this.supplyTransactionsAnulated = response;
      },
        error => this._onWaitingOperations.next(false));
    /*
    this._fpSvc.requestSuplyTransactions()
      .first().subscribe(response => {
        this.supplyTransactions = response;
      }, error => {
        this._logHelper.trace('Error en la función requestSuplyTransactions', error);
      });
      */
  }

  // TODO: devolver imagen base64 desde configuracion
  getImgFromGrade(idGrade: number): string {
    return this._fpInternalSvc.getImgFromGrade(idGrade);
  }
  setClassSupplyTransaction(operation: SuplyTransaction): IDictionaryStringKey<boolean> {
    return this._fpInternalSvc.getNgClassSupplyTransactionBackground(operation);
  }
  onClickSupplyTransaction(transaction: SuplyTransaction) {
     // Electronic Journal - fuelTransactionSelected
     this._electronicJournalService.writeAction({
      type: ActionType.fuelTransactionSelected,
      fuellingPointCode: transaction.id.toString(),
      amount: transaction.money.toString(),
      quantity: transaction.volume.toString(),
    });

    this._fpSvc.manageSupplyTransaccion(transaction)
      .first().subscribe(response => {
        this._onWaitingOperations.next(response);
      });
  }

  getLiteral(group: string, key: string): string {
    return this._languageService.getLiteral(group, key);
  }

}
