import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import {
  MdTabsModule,
  MdSidenavModule,
  MdFormFieldModule,
  MdInputModule,
  MdExpansionModule,
  MdButtonModule,
  MdButtonToggleModule,
  MdDatepickerModule,
  MdNativeDateModule,
  MAT_DATE_LOCALE,
  MdAutocompleteModule,
  MdSnackBarModule,
  MdProgressBarModule,
  MdTooltipModule,
  MdProgressSpinnerModule,
  DateAdapter,
  MdSelectModule,
  MdCheckboxModule,
} from '@angular/material';
import { NgModule } from '@angular/core';
import { HttpModule } from '@angular/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { RoundPipe } from 'app/pipes/round.pipe';
import { DraggableDirective } from 'app/directives/ng2-draggable.directive';

import 'hammerjs'; // Required for some material components to make use of gestures.

// Config
import { MinimumNeededConfiguration } from 'app/config/minimum-needed.config';
import { FormatConfiguration } from 'app/config/format.config';
import { AppDataConfiguration } from 'app/config/app-data.config';

// Directives
import { MainElementDirective } from './directives/main-element.directive';
import { KeyboardDirective } from './directives/keyboard.directive';
import { NumberValidationDirective } from './directives/number-validation.dirctive';

// Services
import { HttpService } from 'app/services/http/http.service';
import { LayoutBuilderService } from 'app/services/layout/layout-builder.service';
import { SlideOverService } from 'app/services/slide-over/slide-over.service';
import { OverlayService } from 'app/services/overlay/overlay.service';
import { AuxiliarActionsManagerService } from 'app/services/auxiliar-actions/auxiliar-actions-manager.service';
import { DocumentService } from 'app/services/document/document.service';
import { DocumentInternalService } from 'app/services/document/document-internal.service';
import { PluService } from 'app/services/plu/plu.service';
import { PluInternalService } from 'app/services/plu/plu-internal.service';
import { StatusBarService } from 'app/services/status-bar/status-bar.service';
import { CustomerService } from 'app/services/customer/customer.service';
import { OperatorService } from 'app/services/operator/operator.service';
import { OperatorInternalService } from 'app/services/operator/operator-internal.service';
import { CustomerInternalService } from 'app/services/customer/customer-internal.service';
import { DocumentSearchInternalService } from 'app/services/document/document-search-internal.service';
import { MixtPaymentInternalService } from 'app/services/payments/mixt-payment-internal.service';
import { CashboxClosureInternalService } from 'app/services/cashbox-closure/cashbox-closure-internal.service';
import { CashboxClosureService } from 'app/services/cashbox-closure/cashbox-closure.service';
import { DocumentSeriesService } from 'app/services/document/document-series.service';
import { KeyboardInternalService } from 'app/services/keyboard/keyboard-internal.service';
import { MixtPaymentService } from 'app/services/payments/mixt-payment.service';
import { CashPaymentService } from 'app/services/payments/cash-payment.service';
import { CreditCardPaymentService } from 'app/services/payments/credit-card-payment.service';
import { RunawayPaymentService } from 'app/services/payments/runaway-payment.service';
import { DocumentCopyService } from 'app/services/document/document-copy.service';
import { FuellingPointsService } from 'app/services/fuelling-points/fuelling-points.service';
import { FuellingPointsInternalService } from 'app/services/fuelling-points/fuelling-points-internal.service';
import { CollectionsInternalService } from 'app/services/collections/collections-internal.service';
import { SignalRPSSService } from 'app/services/signalr/signalr-pss.service';
import { SignalRPaymentTerminalService } from 'app/services/signalr/signalr-payment-terminal.service';
import { SignalRPrintingService } from 'app/services/signalr/signalr-printing.service';
import { TpvMainService } from 'app/services/tpv/tpv-main.service';
import { ScreenService } from 'app/services/screen/screen.service';
import { TpvStatusCheckerService } from 'app/services/tpv-status-checker.service';
import { SignalRPOSService } from 'app/services/signalr/signalr-pos.service';
import { SignalRConnectionManagerService } from 'app/services/signalr/signalr-connection-manager';
import { SignatureInternalService } from 'app/services/signature/signature-internal.service';
import { FuellingPointTestService } from 'app/services/fuelling-points/fuelling-point-test.service';
import { FuellingPointTestInternalService } from 'app/services/fuelling-points/fuelling-point-test-internal.service';
import { LoyaltyService } from 'app/services/loyalty/loyalty.service';
import { RunawayPaymentInternalService } from 'app/services/payments/runaway-payment-internal.service';
import { AuthorizationService } from 'app/services/authorization/authorization.service';
import { AuthorizationInternalService } from 'app/services/authorization/authorization-internal.service';
// import { TPVInitializationService } from 'app/services/tpv-initialization.service';
import { ChangePaymentInternalService } from 'app/services/payments/change-payment-internal.service';

// Components
import { TPVComponent } from './components/tpv/tpv.component';
import { DocumentComponent } from './components/document/document.component';
import { StatusBarComponent } from './components/status-bar/status-bar.component';
import { ActionsComponent } from './components/actions/actions.component';
import {
  FuellingPointsComponent
} from 'app/components/business-specific/fuelling-points-root/fuelling-points/fuelling-points.component';
import {
  FuellingPointAuxiliarActionsComponent
} from 'app/components/auxiliar-actions/fuelling-points-auxiliar-actions/fuelling-points-auxiliar-actions.component';
import { DocumentActionsComponent } from './components/document/document-actions/document-actions.component';
import { OptionsComponent } from './components/actions/options/options.component';
import { PluComponent } from './components/actions/plu/plu.component';
import { CustomerComponent } from './components/customer/customer.component';
import { CustomerSearchComponent } from './components/customer/customer-search/customer-search.component';
import { CustomerCreationComponent } from './components/customer/customer-creation/customer-creation.component';
import { OperatorComponent } from './components/operator/operator.component';
import { CreditCardPaymentComponent } from './components/auxiliar-actions/credit-card-payment/credit-card-payment.component';
import { RunawayComponent } from './components/actions/options/runaway/runaway.component';
import { DocumentCancellationComponent } from './components/actions/options/document-cancellation/document-cancellation.component';
import {
  DocumentSearchComponent
} from './components/actions/options/document-search/document-search.component';
import { MixtPaymentComponent } from './components/auxiliar-actions/mixt-payment/mixt-payment.component';
import { VirtualKeyboardComponent } from './components/virtual-keyboard/virtual-keyboard.component';
import { CollectionsComponent } from './components/actions/options/collections/collections.component';
import { DocumentCopyComponent } from './components/actions/options/document-copy/document-copy.component';
import { LayoutStackContainerComponent } from 'app/components/layout-stack-container/layout-stack-container.component';
import { SlideOverComponent } from './components/slide-over/slide-over.component';
import { InitLoaderComponent } from './components/init-loader/init-loader.component';
import { BootstrapComponent } from './components/bootstrap/bootstrap.component';
import {
  EditDocumentLineComponent
} from 'app/components/auxiliar-actions/edit-document-line/edit-document-line.component';
import {
  SetAmountForZeroPricedArticleComponent
} from 'app/components/auxiliar-actions/set-amount-for-zero-priced-article/set-amount-for-zero-priced-article.component';
import { PumpComponent } from './components/business-specific/fuelling-points-root/fuelling-points/pump/pump.component';
import {
  CashboxClosureComponent
} from 'app/components/auxiliar-actions/cashbox-closure/cashbox-closure.component';
import {
  WaitingOperationsAuxiliarPanelComponent
} from './components/auxiliar-actions/waiting-operations-auxiliar-panel/waiting-operations-auxiliar-panel.component';
import {
  FuellingActionsComponent
} from './components/business-specific/fuelling-points-root/fuelling-points/fuelling-actions/fuelling-actions.component';
import { ConfirmActionComponent } from './components/auxiliar-actions/confirm-action/confirm-action.component';
import { ConfirmActionSlideStaticComponent } from './components/auxiliar-actions/confirm-action-slide-static/confirm-action-slide-static.component';
import { PreviewDocumentComponent } from './components/preview-document/preview-document.component';
import { FuellingPointsRootComponent } from './components/business-specific/fuelling-points-root/fuelling-points-root.component';
import { FuellingPointsSignalrUpdatesService } from 'app/services/fuelling-points/fuelling-points-signalr-updates.service';
import { CashboxService } from 'app/services/cash/cashbox.service';
import { CashEntryComponent } from 'app/components/auxiliar-actions/cash/cash-entry.component';
import { CashEntryInternalService } from 'app/services/cash/cash-entry-internal.service';
import { CashOutComponent } from 'app/components/auxiliar-actions/cash/cash-out.component';
import { CashOutInternalService } from 'app/services/cash/cash-out-internal.service';
import { ExternalActionsViewerComponent } from 'app/components/auxiliar-actions/external-actions-viewer/external-actions-viewer.component';
import { TpvInformationSidenavComponent } from 'app/components/tpv-information-sidenav/tpv-information-sidenav.component';
import { FuellingPointTestComponent } from 'app/components/auxiliar-actions/fuelling-point-test/fuelling-point-test.component';
import { ConfirmActionService } from 'app/services/confirm-action/confirm-action.service';
import { AlertsService } from 'app/services/alerts/alerts.service';
import { AlertsInternalService } from 'app/services/alerts/alerts-internal.service';
import { FuellingPointsDocumentConfirmActionsService } from './services/fuelling-points/fuelling-points-document-confirm-actions.service';
import { IdocumentConfirmActions } from 'app/shared/idocument-confirm-actions';
import { MyDateAdapter } from 'app/shared/my-date-adapter/myDateAdapter';
import { LoyaltyComponent } from 'app/components/auxiliar-actions/loyalty/loyalty.component';
import { NgIdleKeepaliveModule } from '@ng-idle/keepalive'; // this includes the core NgIdleModule but includes keepalive providers for easy wireup
import { TpvIdleService } from './services/tpv-idle.service';
import { SignalrUpdater } from './services/signalr/signalr-updater';
import { SignalrUpdaterConnectionManager } from 'app/services/signalr/signalr-updater-connection-manager';
import { ExternalActionViewerService } from './services/external-action-viewer/external-action-viewer.service';
import {
  CustomerFleetIdentificationComponent
} from 'app/components/customer/customers-fleet-identification/customers-fleet-identification.component';
import { CustomerAddInformationComponent } from './components/customer/customer-add-information/customer-add-information.component';
import { DispatchNoteService } from './services/payments/dispatch-note.service';
import { AuthorizationComponent } from './components/authorization/authorization.component';
import { AccordionComponent } from './components/actions/plu/accordion/accordion.component';
import { CategoriesComponent } from './components/actions/plu/categories/categories.component';
import { CategoriesMultilevelComponent } from './components/actions/plu/categories-multilevel/categories-multilevel.component';
import { CashOutOfflineComponent } from './src/custom/components/cash-offline/cash-out-offline.component';
import { CashboxOfflineService } from './src/custom/services/cash-offline-services/cashbox-offline.service';
import { CashOutInternalServiceOffline } from './src/custom/services/cash-offline-services/cash-out-internal-offline.service';
// import { SharedModule } from './src/custom/shared/shared.module';
import { CashboxClosureOfflineComponent } from './src/custom/components/cashbox-closure-offline/cashbox-closure-offline.component';
import { CashboxClosureInternalServiceOffline
} from './src/custom/services/cashbox-closure-offline-services/cashbox-closure-internal-offline.service';
import { CashboxClosureServiceOffline } from './src/custom/services/cashbox-closure-offline-services/cashbox-closure-offline.service';
import { PumpAuxComponent } from './components/business-specific/fuelling-points-root/fuelling-points/pump-aux/pump-aux.component';
import { PromotionsService } from './services/promotions/promotions.service';
import { ChangeDeliveredComponent } from './components/actions/change-delivered/change-delivered.component';
import { SignalRTMEService } from './services/signalr/signalr-tme.service';
import { CategoriesCustomComponent } from './components/actions/plu/categories-custom/categories-custom.component';
import { OptionsAuxiliarComponent } from './components/actions/options-auxiliar/options-auxiliar.component';
import { SignalROPOSService } from './services/signalr/signalr-opos.service';
import { CofoAnulacionParcialModule } from './modules/cofo-anulacion-parcial/cofo-anulacion-parcial.module';
import { StaticKeyboardComponent } from './components/static-keyboard/static-keyboard.component';
import { FuellingPointsAnulatedService } from './services/fuelling-points/fuelling-points-anulated.service';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { MomentModule } from 'angular2-moment';
import { SessionInternalService } from './services/session/session-internal.service';
import { ConfirmActionStaticComponent } from './components/auxiliar-actions/confirm-action-static/confirm-action-static.component';
import { LanguageService } from 'app/services/language/language.service';
import { TelefonoDeudaComponent } from './components/actions/options/telefono-deuda/telefono-deuda.component';
import {
  DocumentSearchAnulacionParcialComponent
} from './components/actions/options/document-search-anulacion-parcial/document-search-anulacion-parcial.component';
import {
  DocumentCopyAnulacionParcialComponent
} from './components/actions/options/document-copy-anulacion-parcial/document-copy-anulacion-parcial.component';
import { InformeVentasComponent } from './components/actions/options/informe-ventas/informe-ventas.component';
import { MatriculaClienteComponent } from './components/actions/options/matricula-cliente/matricula-cliente.component';
import { DeudasClienteComponent } from './components/actions/options/deudas-cliente/deudas-cliente.component';
import { DocumentSearchDeudasClienteComponent
} from './components/actions/options/document-search-deudas-cliente/document-search-deudas-cliente.component';
import { MixtPaymentMultipleComponent } from './src/custom/components/mixt-payment-multiple/mixt-payment-multiple.component';
import { LookScreenComponent } from './components/look-screen/look-screen.component';
import { TmeService } from './services/tme/tme.service';
import { PrintingService } from './services/printing/printing.service';
import { GradesChangePricesComponent } from './components/business-specific/grades-change-prices/grades-change-prices.component';
import { GradesChangePricesInternalService } from 'app/services/grades-change-price/grades-change-prices-internal.service';
import { GradesChangePricesService } from 'app/services/grades-change-price/grades-change-prices.service';
import { PrintingInternalService } from './services/printing/printing-internal.service';
import { SignalRMultiTPVService } from 'app/services/signalr/signalr-multitpv.service';
import { SignalRMultiTPVConnectionManagerService } from 'app/services/signalr/signalr-multitpv-connection-manager';
import { MultitpvFuellingPointsService } from 'app/services/multitpv/multitpv-fuelling-points.service';

import { ElectronicJournalService } from 'app/services/electronic-journal/electronic-journal.service';
import { ActionType } from 'app/shared/electronic-journal/action-type.enum';
import { SignalRTMEConnectionManagerService } from './services/signalr/signalr-tme-connection-manager';
// import { SignalRPSSConnectionManagerService } from './services/signalr/signalr-pss-connection-manager';
import { LogHelper } from 'app/helpers/log-helper';
import { LogInternalService } from 'app/services/logger/log-internal.service';

@NgModule({
  declarations: [
    TPVComponent,
    FuellingPointsComponent,
    MixtPaymentMultipleComponent,
    DocumentComponent,
    StatusBarComponent,
    ActionsComponent,
    FuellingPointTestComponent,
    FuellingPointAuxiliarActionsComponent,
    DocumentActionsComponent,
    OptionsComponent,
    PluComponent,
    CustomerComponent,
    CustomerSearchComponent,
    CustomerCreationComponent,
    CreditCardPaymentComponent,
    OperatorComponent,
    RunawayComponent,
    CashboxClosureComponent,
    CashEntryComponent,
    CashOutComponent,
    DocumentCancellationComponent,
    DocumentSearchComponent,
    DocumentSearchAnulacionParcialComponent,
    DocumentSearchDeudasClienteComponent,
    MixtPaymentComponent,
    KeyboardDirective,
    NumberValidationDirective,
    VirtualKeyboardComponent,
    CollectionsComponent,
    DeudasClienteComponent,
    DocumentCopyComponent,
    DocumentCopyAnulacionParcialComponent,
    LayoutStackContainerComponent,
    SlideOverComponent,
    InitLoaderComponent,
    BootstrapComponent,
    MainElementDirective,
    EditDocumentLineComponent,
    SetAmountForZeroPricedArticleComponent,
    PumpComponent,
    WaitingOperationsAuxiliarPanelComponent,
    FuellingActionsComponent,
    ConfirmActionComponent,
    ConfirmActionSlideStaticComponent,
    DraggableDirective,
    PreviewDocumentComponent,
    FuellingPointsRootComponent,
    ExternalActionsViewerComponent,
    DraggableDirective,
    TpvInformationSidenavComponent,
    LoyaltyComponent,
    RoundPipe,
    AuthorizationComponent,
    CustomerFleetIdentificationComponent,
    CustomerAddInformationComponent,
    AccordionComponent,
    CategoriesComponent,
    CategoriesMultilevelComponent,
    PumpAuxComponent,
    CashOutOfflineComponent,
    CashboxClosureOfflineComponent,
    ChangeDeliveredComponent,
    CategoriesCustomComponent,
    OptionsAuxiliarComponent,
    StaticKeyboardComponent,
    SidebarComponent,
    ConfirmActionStaticComponent,
    TelefonoDeudaComponent,
    InformeVentasComponent,
    MatriculaClienteComponent,
    LookScreenComponent,
    GradesChangePricesComponent,
  ],
  imports: [

    // MODULOS PRODUCTO
    // SharedModule,
    MomentModule,
    BrowserModule,
    HttpModule,
    MdTabsModule,
    MdSelectModule,
    MdSidenavModule,
    MdExpansionModule,
    BrowserAnimationsModule,
    MdFormFieldModule,
    MdInputModule,
    MdButtonModule,
    MdButtonToggleModule,
    MdSnackBarModule,
    FormsModule,
    MdDatepickerModule,
    MdNativeDateModule,
    MdAutocompleteModule,
    ReactiveFormsModule,
    MdProgressBarModule,
    MdTooltipModule,
    MdProgressSpinnerModule,
    NgIdleKeepaliveModule.forRoot(),
    CofoAnulacionParcialModule,
    MdCheckboxModule,
  ],
  providers: [
    { provide: MAT_DATE_LOCALE, useValue: 'es-ES' },
    { provide: IdocumentConfirmActions, useClass: FuellingPointsDocumentConfirmActionsService },
    { provide: DateAdapter, useClass: MyDateAdapter },
    TpvIdleService,
    HttpService,
    MinimumNeededConfiguration,
    FormatConfiguration,
    AppDataConfiguration,
    LayoutBuilderService,
    SlideOverService,
    OverlayService,
    AuxiliarActionsManagerService,
    DocumentInternalService,
    DocumentService,
    PluService,
    PluInternalService,
    StatusBarService,
    CustomerService,
    OperatorService,
    OperatorInternalService,
    CustomerInternalService,
    DocumentSearchInternalService,
    DocumentSeriesService,
    MixtPaymentInternalService,
    DecimalPipe,
    RoundPipe,
    CollectionsInternalService,
    MixtPaymentService,
    CashPaymentService,
    KeyboardInternalService,
    CreditCardPaymentService,
    RunawayPaymentService,
    DocumentCopyService,
    FuellingPointsService,
    FuellingPointsAnulatedService,
    FuellingPointsInternalService,
    CashboxClosureInternalService,
    CashboxClosureService,
    CashboxService,
    CashEntryInternalService,
    CashOutInternalService,
    SignalRPSSService,
    SignalRTMEService,
    SignalROPOSService,
    SignalRPaymentTerminalService,
    SignalRPrintingService,
    TpvMainService,
    ScreenService,
    FuellingPointsSignalrUpdatesService,
    TpvStatusCheckerService,
    ConfirmActionService,
    SignalRPOSService,
    SignalRConnectionManagerService,
    SignalrUpdaterConnectionManager,
    AlertsService,
    AlertsInternalService,
    SignatureInternalService,
    FuellingPointTestService,
    FuellingPointTestInternalService,
    SignalrUpdater,
    ExternalActionViewerService,
    LoyaltyService,
    SignalrUpdater,
    RunawayPaymentInternalService,
    DispatchNoteService,
    AuthorizationService,
    AuthorizationInternalService,
    PromotionsService,
    // TPVInitializationService
    /*MODULOS COFO*/
    CashboxOfflineService,
    CashOutInternalServiceOffline,
    CashboxClosureInternalServiceOffline,
    CashboxClosureServiceOffline,
    ChangePaymentInternalService,
    SessionInternalService,
    LanguageService,
    TmeService,
    PrintingService,
    GradesChangePricesInternalService,
    GradesChangePricesService,
    PrintingInternalService,
    SignalRMultiTPVService,
    SignalRMultiTPVConnectionManagerService,
    MultitpvFuellingPointsService,
    ElectronicJournalService,
    SignalRTMEConnectionManagerService,
    // SignalRPSSConnectionManagerService
    LogHelper,
    LogInternalService
  ],
  entryComponents: [
    FuellingPointsRootComponent,
    FuellingPointAuxiliarActionsComponent,
    WaitingOperationsAuxiliarPanelComponent,
    LayoutStackContainerComponent,
    DocumentComponent,
    ActionsComponent,
    DocumentActionsComponent,
    SlideOverComponent,
    EditDocumentLineComponent,
    SetAmountForZeroPricedArticleComponent,
    OperatorComponent,
    CustomerComponent,
    CreditCardPaymentComponent,
    MixtPaymentComponent,
    MixtPaymentMultipleComponent,
    RunawayComponent,
    CashboxClosureComponent,
    CashEntryComponent,
    CashOutComponent,
    DocumentCopyComponent,
    DocumentCopyAnulacionParcialComponent,
    DocumentCancellationComponent,
    CollectionsComponent,
    DeudasClienteComponent,
    ConfirmActionComponent,
    ConfirmActionSlideStaticComponent,
    ExternalActionsViewerComponent,
    TpvInformationSidenavComponent,
    FuellingPointTestComponent,
    LoyaltyComponent,
    AuthorizationComponent,
    CustomerFleetIdentificationComponent,
    CustomerAddInformationComponent,
    /*MODULOS COFO*/
    CashOutOfflineComponent,
    CashboxClosureOfflineComponent,
    TelefonoDeudaComponent,
    InformeVentasComponent,
    MatriculaClienteComponent,
    GradesChangePricesComponent
  ],
  bootstrap: [BootstrapComponent],
  exports: [CashOutOfflineComponent, CashboxClosureOfflineComponent],
})
export class TPVModule {
  constructor(
    private _electronicJournal: ElectronicJournalService,
    private  _logHelper: LogHelper
  ) {
    // Electronic Journal - tPVStarted
    this._electronicJournal.writeAction({
      type: ActionType.appStarted,
    });

    // Electronic Journal - tPVStopped
    window.addEventListener('beforeunload', () =>
      this._electronicJournal.writeAction({
        type: ActionType.appStopped,
      })
    );
    this._logHelper.trace('TPVModule created');
  }
}
