export interface Posinformation {
    /**
     * POS Code Identificator
     * Sin NCompany
     */
    code: string;
    /**
     * Codigo de la caja
     * Sin NCompany
     */
    cashBoxCode: string;
    /**
     * Codigo de la tienda (Sin NCompany)
     */
    shopCode: string;
    /**
     * Cpodigo del almacen (sin NCompany)
     */
    storeCode: string;
    /**
     * Codigo de la compañia (NCompany)
     */
    companyId: string;
    /**
     * Identificador guid del tpv
     */
    guid: string;
}
