import { CashboxClosureSummarySectionLine } from 'app/shared/cashbox/cashbox-closure-summary-section-line';

export interface CashboxClosureSummary {

    /**
     * Identificador
     *
     * @type {string}
     * @memberof CashboxClosureSummary
     */
    id: string;

    /**
     * Código de empresa asociado
     *
     * @type {string}
     * @memberof CashboxClosureSummary
     */
    companyCode: string;

    /**
     * Código de caja asociado (excluye código de empresa)
     *
     * @type {string}
     * @memberof CashboxClosureSummary
     */
    cashboxCode: string;

    /**
     * Código de operador que generó el cierre (excluye código de empresa)
     *
     * @type {string}
     * @memberof CashboxClosureSummary
     */
    operatorCode: string;

    //#region SUMMARY HEADER

    /**
     * Código del cierre de caja
     *
     * @type {string}
     * @memberof CashboxClosureSummary
     */
    closureNumber: string;

    /**
     *
     *
     * @type {string}
     * @memberof CashboxClosureSummary
     */
    companyName: string;

    /**
     *
     *
     * @type {string}
     * @memberof CashboxClosureSummary
     */
    cashboxName: string;

    /**
     * Nombre del operador asociado
     *
     * @type {string}
     * @memberof CashboxClosureSummary
     */
    operatorName: string;

    /**
     * Fecha y hora Local de creación del cierre de caja
     *
     * @type {Date}
     * @memberof CashboxClosureSummary
     */
    creationLocalDateTime: Date;

    /**
     * Fecha y hora UTC de creación del cierre de caja
     *
     * @type {Date}
     * @memberof CashboxClosureSummary
     */
    creationUTCDateTime: Date;

    /**
     * Fecha y hora de la entrada más antigua incluída en el cierre de caja
     *
     * @type {Date}
     * @memberof CashboxClosureSummary
     */
    oldestRecordDateTime: Date;

    /**
     * Fecha y hora de la entrada más nueva incluída en el cierre de caja
     *
     * @type {Date}
     * @memberof CashboxClosureSummary
     */
    newestRecordDateTime: Date;

    //#endregion SUMMARY HEADER

    //#region BASIC SUMMARY

    /**
     * Saldo de apertura
     *
     * @type {number}
     * @memberof CashboxClosureSummary
     */
    openingBalance: number;

    /**
     * Saldo total
     *
     * @type {number}
     * @memberof CashboxClosureSummary
     */
    totalBalance: number;

    /**
     * Saldo metálico
     *
     * @type {number}
     * @memberof CashboxClosureSummary
     */
    metallicBalance: number;

    /**
     * Saldo NO metálico
     *
     * @type {number}
     * @memberof CashboxClosureSummary
     */
    nonMetallicBalance: number;

    /**
     * Saldo del cierre anterior
     *
     * @type {number}
     * @memberof CashboxClosureSummary
     */
    previousClosureBalance: number;

    /**
     * Metálico real
     *
     * @type {number}
     * @memberof CashboxClosureSummary
     */
    realMetallicAmount: number;

    /**
     * Descuadre de caja metálico (RealMetallicAmount - MetallicBalance)
     *
     * @type {number}
     * @memberof CashboxClosureSummary
     */
    unbalancedMetallicAmount: number;

    /**
     * Cantidad metálica extraída en el cierre de caja
     *
     * @type {number}
     * @memberof CashboxClosureSummary
     */
    extractedAmount: number;

    /**
     * Número de documentos referidos en el cierre
     *
     * @type {number}
     * @memberof CashboxClosureSummary
     */
    numberOfReferredDocuments: number;

    /**
     * Número de documento referido más bajo
     *
     * @type {string}
     * @memberof CashboxClosureSummary
     */
    lowestReferredDocumentNumber: string;

    /**
     * Número de documento referido más alto
     *
     * @type {string}
     * @memberof CashboxClosureSummary
     */
    highestReferredDocumentNumber: string;

    //#endregion BASIC SUMMARY

    //#region TOTALS

    /**
     * Cantidad total metálica extraída
     *
     * @type {number}
     * @memberof CashboxClosureSummary
     */

    totalExtractedMetallicAmount: number;
    /**
     * Cantidad total no metálica extraída
     *
     * @type {number}
     * @memberof CashboxClosureSummary
     */
    totalExtractedNonMetallicAmount: number;

    //#endregion TOTALS

    /**
     * Líneas de resúmenes de ventas del cierre
     *
     * @type {CashboxClosureSummarySectionLine[]}
     * @memberof CashboxClosureSummary
     */
    sections: CashboxClosureSummarySectionLine[];
}
