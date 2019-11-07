export interface Promotion {
    /**
    * Codigo de la promocion
    */
    code: string;
    /**
    * Descripcion de la promocion
    */
    description: string;
    /**
    * Descripcion corta de la promocion
    */
    descriptionTpv: string;
    /**
    * cantidad total de articulos para la promocion
    */
    qtTotal: number;
    /**
    * Cantidad de descuentos de la promocion
    */
    qtDtos: number;
    /**
    * Descuento de la promocion
    */
    dto: number;
    /**
    * Tipo de la promocion
    */
    type: number;
    /**
    * Fecha inicio de la promocion
    */
    vFrom: Date;
    /**
    * Fecha fin de la promocion
    */
    vTo: Date;
    /**
    * Subsidiario
    */
    subsidiary: string;
    /**
    * Prioridad de la promocion
    */
    prioridad?: number;
    /**
    * central de la promocion
    */
    central: boolean;
    /**
    * tienda de la promocion
    */
    tienda: string;
    /**
    * indica si la promocion es un combo
    */
    isCombo: boolean;
    /**
    * importe maximo de la promoion
    */
    importeMinimo?: number;
}
