export interface CashboxClosureSummarySectionLine {

    /**
     * Tipo de línea de sumario.
     * Vease CashboxClosureSummarySectionLineType para obtener más información.
     * @type {string}
     * @memberof CashboxClosureSummarySectionLine
     */
    sectionLineType: string;

    /**
     * Texto que identifica el concepto referenciado por la línea dentro de su tipo de sumario
     *
     * @type {string}
     * @memberof CashboxClosureSummarySectionLine
     */
    reference: string;

    /**
     * Cantidad de ítems afectos
     *
     * @type {number}
     * @memberof CashboxClosureSummarySectionLine
     */
    quantity?: number;

    /**
     * Texto que representa la abreviatura de la unidad de medida utilizada en la cuantificación de ítems de la línea
     *
     * @type {string}
     * @memberof CashboxClosureSummarySectionLine
     */
    measureUnit?: string;

    /**
     * Cantidad monetaria de la línea de sumario
     *
     * @type {number}
     * @memberof CashboxClosureSummarySectionLine
     */
    amount: number;

    /**
     * Texto que representa el símbolo de la moneda utilizada en la cantidad monetaria de la línea
     *
     * @type {string}
     * @memberof CashboxClosureSummarySectionLine
     */
    currencySymbol: string;
}
