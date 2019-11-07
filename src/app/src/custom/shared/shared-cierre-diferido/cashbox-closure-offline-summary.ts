import { FuelSales } from './fuel-sales';
import { EntradasCajon } from './entradas-cajon';
import { EfectivoCajaFuerte } from './efectivo-caja-fuerte';
import { VentasPorCategorias } from './ventas-por-categorias';
/* import { CashboxClosureOfflineSummarySectionLine } from './cashbox-closure-offline-summary-section-line'; */
import { ResumenRecaudacion } from './resumen-recaudacion';
/* import { Currency } from 'app/shared/currency/currency'; */
import { Posinformation } from 'app/shared/posinformation';

export interface CashboxClosureSummaryOffline {

    currencySymbol: string;
    posInformation: Posinformation;

    companyCode: string;

    cashboxCode: string;
    operatorCode: string;
    creationLocalDateTime: Date;

    totalEfectivoCajaFuerte: number;
    totalEntradasCajon: number;
    totalCategorias: number;
    totalCategoriasVentas: number;
    totalCombustible: number;
    totalResumenRecaudacion: number;
    importeTotalEntrasCajon: number;
    importeTotalSalidaCajon: number;
    importeTotalOtrasEntradas: number;
    totalSalidaOnce: number;
    totalCobrosProveedor: number;
    totalPagosProveedor: number;
    totalResumenOtrosRetiros: number;
    recaudacion: number;
    efectivoUltimoCierreDiferido: number;
    diferencia: number;

    entradasCajon: EntradasCajon[];
    fuelSales: FuelSales[];
    resumenRecaudacion: ResumenRecaudacion[];
    ventasPorCategorias: VentasPorCategorias[];
    efectivoCajaFuerte: EfectivoCajaFuerte[];


    //#region SUMMARY HEADER

    /**
     * Código del cierre de caja
     *
     * @type {string}
     * @memberof CashboxClosureSummaryOffline
     */
    closureNumber: string;

    /**
     *
     *
     * @type {string}
     * @memberof CashboxClosureSummaryOffline
     */
    companyName: string;

    /**
     *
     *
     * @type {string}
     * @memberof CashboxClosureSummaryOffline
     */
    cashboxName: string;

    /**
     * Nombre del operador asociado
     *
     * @type {string}
     * @memberof CashboxClosureSummaryOffline
     */
    operatorName: string;

    /* creationUTCDateTime: Date;

    oldestRecordDateTime: Date;

    newestRecordDateTime: Date; */
 
    //#endregion SUMMARY HEADER

}
