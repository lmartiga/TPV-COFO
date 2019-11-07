import { Component, OnInit, OnDestroy, HostBinding } from '@angular/core';
import { Subject } from 'rxjs/Subject';
import { Observable } from 'rxjs/Observable';
import { Subscription } from 'rxjs/Subscription';
import { LogHelper } from 'app/helpers/log-helper';
import { ConfirmActionService } from 'app/services/confirm-action/confirm-action.service';
import { DocumentInternalService } from 'app/services/document/document-internal.service';
import { FuellingPointTestService } from 'app/services/fuelling-points/fuelling-point-test.service';
import { KeyboardInternalService } from 'app/services/keyboard/keyboard-internal.service';
import { SignalRPSSService } from 'app/services/signalr/signalr-pss.service';
// import { SignalRPrintingService } from 'app/services/signalr/signalr-printing.service';
import { StatusBarService } from 'app/services/status-bar/status-bar.service';
import { ConfirmActionType } from 'app/shared/confirmAction/confirm-action-type.enum';
import { FuellingPointTestData } from 'app/shared/fuelling-point/fuelling-point-test-data';
import { FuellingTank } from 'app/shared/fuelling-point/fuelling-tank';
import { SuplyTransaction } from 'app/shared/fuelling-point/suply-transaction';
import {
  FinalizeSupplyTransactionForFuelTestResponseStatus
} from 'app/shared/hubble-pos-signalr-responses/finalize-supply-transaction-for-fuel-test-response-status.enum';
import { IActionFinalizable } from 'app/shared/iaction-finalizable';
import { PrintResponse } from 'app/shared/signalr-server-responses/printingModuleHub/print-response';
import { PrintResponseStatuses } from 'app/shared/signalr-server-responses/printingModuleHub/print-response-statuses.enum';
import { LanguageService } from 'app/services/language/language.service';
import { PrintingService } from 'app/services/printing/printing.service';

@Component({
  selector: 'tpv-fuelling-point-test',
  templateUrl: './fuelling-point-test.component.html',
  styleUrls: ['./fuelling-point-test.component.scss']
})

export class FuellingPointTestComponent implements OnInit, OnDestroy, IActionFinalizable<boolean> {
  @HostBinding('class') class = 'tpv-fuelling-point-test';

  private _onTestFuellingPointsExecuted: Subject<boolean> = new Subject();
  private _subscriptions: Subscription[] = [];
  private _supplyTransaction: SuplyTransaction;

  // Datos de formulario
  fuellingTestEntryData: FuellingPointTestData = { deviation: undefined, observations: '' };

  // Literales
  titleLiteral: string;
  subtitleLiteral: string;
  textButtonLiteral: string;
  withReturnLiteral: string;
  withNoReturnLiteral: string;
  acceptLiteral: string;
  deviationLiteral: string;
  observationsLiteral: string;
  tankLiteral: string;
  requestFailedLiteral: string;
  errorHeaderLiteral: string;

  withReturnSelected: boolean;
  returnTankId: string;
  incompleteFormLiteral: string;
  completedOkLiteral: string;
  completedKoLiteral: string;
  requiredField: string;

  fuellingPointTestSuccessLiteral: string;
  fuellingPointTestKOLiteral: string;
  fuellingPointTestKODeviationLiteral: string;
  printingLiteral: string;
  printSucceedLiteral: string;
  printFailedLiteral: string;

  // Variables expuestas a HTML
  availableFuellingTanks: FuellingTank[];
  defaultFuellingTank: FuellingTank;
  availableFuellingTanksButtonColumnWidthList: string[];


  constructor(
  private _keyboardInternalService: KeyboardInternalService,
  private _signalrPssService: SignalRPSSService,
  private _documentInternalService: DocumentInternalService,
  private _confirmActionService: ConfirmActionService,
  private _fuellingPointTestService: FuellingPointTestService,
  private _statusBarService: StatusBarService,
  // private _printService: SignalRPrintingService,
  private _printService: PrintingService,
  private _languageService: LanguageService,
  private _logHelper: LogHelper,
  ) {
    this.titleLiteral = this.getLiteral('fuelling_point_test_component', 'header_FuellingPointTest');
    this.subtitleLiteral = this.subtitleLiteral = this.getLiteral('fuelling_point_test_component', 'literal_FuellingPointTest_TestType');
    this.withReturnLiteral = this.getLiteral('fuelling_point_test_component', 'literal_FuellingPointTest_WithReturn');
    this.withNoReturnLiteral = this.getLiteral('fuelling_point_test_component', 'literal_FuellingPointTest_WithoutReturn');
    this.textButtonLiteral = this.getLiteral('fuelling_point_test_component', 'button_FuellingPointTest_SendTest');
    this.deviationLiteral = this.getLiteral('fuelling_point_test_component', 'literal_FuellingPointTest_Deviation');
    this.observationsLiteral = this.getLiteral('fuelling_point_test_component', 'observationsLiteral');
    this.requiredField = this.getLiteral('fuelling_point_test_component', 'validation_FuellingPointTest_MandatoryField');
    this.acceptLiteral = this.getLiteral('fuelling_point_test_component', 'button_FuellingPointTest_OK');
    this.tankLiteral = this.getLiteral('fuelling_point_test_component', 'literal_FuellingPointTest_Tank');
    this.fuellingPointTestSuccessLiteral = this.getLiteral('fuelling_point_test_component', 'message_FuellingPointTest_TestMadeSuccessfully');
    this.fuellingPointTestKOLiteral = this.getLiteral('fuelling_point_test_component', 'error_FuellingPointTest_TestCouldNotBeCompleted');
    this.fuellingPointTestKODeviationLiteral = this.getLiteral('fuelling_point_test_component', 'error_FuellingPointTest_DeviationNotOk');
    this.printingLiteral = this.getLiteral('fuelling_point_test_component', 'message_FuellingPointTest_Printing');
    this.printSucceedLiteral = this.getLiteral('fuelling_point_test_component', 'message_FuellingPointTest_PritingFinished');
    this.printFailedLiteral = this.getLiteral('fuelling_point_test_component', 'error_FuellingPointTest_PrintingFailed');
    this.errorHeaderLiteral = this.getLiteral('fuelling_point_test_component', 'header_FuellingPointTest_ErrorPanel');
    this.incompleteFormLiteral = this.getLiteral('fuelling_point_test_component', 'error_FuellingPointTest_FormIsNotCompleted');
    this.completedOkLiteral = this.getLiteral('fuelling_point_test_component', 'message_FuellingPointTest_OperationOK');
    this.completedKoLiteral = this.getLiteral('fuelling_point_test_component', 'error_FuellingPointTest_OperationKO');
    this.requestFailedLiteral = this.getLiteral('fuelling_point_test_component', 'error_FuellingPointTest_RequestFailed');

    this.withReturnSelected = true;
    this.returnTankId = '';
    this.availableFuellingTanks =  [];
  }

  ngOnInit () {
    this._keyboardInternalService.CloseKeyBoard();
    // Request para obtener el surtidor por defecto
    this._fuellingPointTestService.getFuellingTankBySupplyTransaction(this._supplyTransaction)
    .first().subscribe(
      fuelTank => {
        this.defaultFuellingTank = fuelTank;
        this.returnTankId = fuelTank.id;
        this._fuellingPointTestService.availableFuelTanks(this._supplyTransaction).first().subscribe(fuelTanks => {
          this.availableFuellingTanks = fuelTanks;
          });
      });
  }

  ngOnDestroy() {
    this._subscriptions.forEach(s => s.unsubscribe());
  }

  onFinish(): Observable<boolean> {
    return this._onTestFuellingPointsExecuted.asObservable();
  }

  forceFinish(): void {
    this._keyboardInternalService.CloseKeyBoard();
    this._onTestFuellingPointsExecuted.next(false);
  }

  onSubmit() {
    this._keyboardInternalService.CloseKeyBoard();
    if (Math.abs(this.fuellingTestEntryData.deviation) <= this._supplyTransaction.volume) {
      this._signalrPssService.finalizeSupplyTransactionForFuelTest (
        this._documentInternalService.currentDocument.operator.id,
        this._supplyTransaction.id,
        this._supplyTransaction.fuellingPointId,
        this.fuellingTestEntryData.deviation,
        (this.withReturnSelected == true ? this.returnTankId : ''),
        this.fuellingTestEntryData.observations)
      .first().subscribe( response => {
        if (response.status == FinalizeSupplyTransactionForFuelTestResponseStatus.successful) {
          this._statusBarService.publishProgress(25);
          const currentDateTime: Date = new Date();
          const returnTankCaption: FuellingTank = this.availableFuellingTanks.find(t => t.id == this.returnTankId);
          this._logHelper.trace(this.fuellingPointTestSuccessLiteral);
          this._statusBarService.publishMessage(this.printingLiteral);
          this._statusBarService.publishProgress(50);
          this._statusBarService.publishMessage(this.fuellingPointTestSuccessLiteral);
          // Se invoca la impresión al servicio de impresión signalR de angular
          this._printService.printFuellingPointTest(
            this._documentInternalService.currentDocument.operator,
            this.fuellingTestEntryData,
            this.defaultFuellingTank.caption,
            this.withReturnSelected == true ? returnTankCaption.caption : '',
            this._supplyTransaction,
            currentDateTime)
            .first().subscribe((printResponse: PrintResponse) => {
                if (printResponse.status == PrintResponseStatuses.successful) {
                  // Si la respuesta de ambas solicitudes es positiva, reportamos ok al llamante
                  this._statusBarService.publishProgress(75);
                  this._statusBarService.publishProgress(100);
                  this._statusBarService.publishMessage(this.fuellingPointTestSuccessLiteral + ' ' + this.printSucceedLiteral);
                  this._onTestFuellingPointsExecuted.next(true); // True porque se consumió el supplyTransaction
                } else {
                  // Impresión falló con respuesta positiva
                  this._logHelper.trace(
                    `La respuesta ha sido positiva, pero la impresión falló: ` +
                    `${PrintResponseStatuses[printResponse.status]}. Mensaje: ${printResponse.message}`);
                  this._confirmActionService.promptActionConfirm(
                    this.printFailedLiteral + ' ' + this.completedOkLiteral,
                    this.acceptLiteral,
                    undefined,
                    this.errorHeaderLiteral,
                    ConfirmActionType.Error)
                  .first().subscribe(r =>
                    this._onTestFuellingPointsExecuted.next(true) // True porque se consumió el supplyTransaction
                  );
                }
              },
              error => {
                // Impresión falló con respuesta positiva
                this._logHelper.trace(`La respuesta ha sido positiva, pero la impresión falló: ${error.toString()}`);
                this._confirmActionService.promptActionConfirm(
                  this.printFailedLiteral + ' ' + this.completedOkLiteral,
                  this.acceptLiteral,
                  undefined,
                  this.errorHeaderLiteral,
                  ConfirmActionType.Error)
                  .first().subscribe(r =>
                    this._onTestFuellingPointsExecuted.next(true) // True porque se consumiÃ³ el supplyTransaction
                  );
                }
              );
            } else if (response.status == FinalizeSupplyTransactionForFuelTestResponseStatus.supplyTransactionCleanedButFuelTestCreationFailedError) {
              // Se limpió la supplyTransaction, pero no se logró guardar la información de la prueba
              this._logHelper.trace(
                `${this.completedKoLiteral}: ` +
                `${FinalizeSupplyTransactionForFuelTestResponseStatus[response.status]}. Mensaje: ${response.message}`
              );
              this._confirmActionService.promptActionConfirm(
                this.getLiteral('fuelling_point_test_component', 'message_EditLine_FailedStoreInformation') + ' ' +
                this.getLiteral('fuelling_point_test_component', 'message_EditLine_FillFuellingpointInformation') + ' ' +
                response.message,
                this.acceptLiteral,
                undefined,
                this.errorHeaderLiteral,
                  ConfirmActionType.Error)
                .first().subscribe(r =>
                  this._onTestFuellingPointsExecuted.next(true) // True porque se consumió el supplyTransaction
                );
            } else {
              // Respuesta negativa
              this._logHelper.trace(
                `${this.completedKoLiteral}: ` +
                `${FinalizeSupplyTransactionForFuelTestResponseStatus[response.status]}. Mensaje: ${response.message}`
              );
              this._confirmActionService.promptActionConfirm(
                this.completedKoLiteral,
                this.acceptLiteral,
                undefined,
                this.errorHeaderLiteral,
                ConfirmActionType.Error)
              .first().subscribe(r =>
                this._onTestFuellingPointsExecuted.next(false)
              );
            }
          },
          error => {
            // Error genérico
            this._logHelper.trace(`${this.fuellingPointTestKOLiteral}: ${error.toString()}`);
            this._confirmActionService.promptActionConfirm(
              this.fuellingPointTestKOLiteral,
              this.acceptLiteral,
              undefined,
              this.errorHeaderLiteral,
              ConfirmActionType.Error)
            .first().subscribe(r =>
              this._onTestFuellingPointsExecuted.next(false)
            );
          });
        } else {
            this._confirmActionService.promptActionConfirm(
              this.fuellingPointTestKODeviationLiteral,
              this.acceptLiteral,
              undefined,
              this.errorHeaderLiteral,
              ConfirmActionType.Error)
            .first().subscribe(r =>
              this._onTestFuellingPointsExecuted.next(false)
            );
        }
        setTimeout(() => {
          this._statusBarService.resetProgress();
        }, 3000);
  }

  set supplyTransaction(value: SuplyTransaction) {
    this._supplyTransaction = value;
  }

  get supplyTransaction(): SuplyTransaction {
    return this._supplyTransaction;
  }

  returnTankSelected(selectedTank: FuellingTank) {
    this.returnTankId = selectedTank.id;
  }

  getLiteral(group: string, key: string): string {
    return this._languageService.getLiteral(group, key);
  }

}
