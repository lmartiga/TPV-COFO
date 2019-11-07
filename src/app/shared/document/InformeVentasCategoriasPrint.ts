import { CategSubtotalInforme } from './CategSubtotalInforme';

export interface InformeVentasCategoriasPrint {
    Fecha: Date;
    TotalDiaList: number;
    ListCategSubtotal: CategSubtotalInforme [];
}
