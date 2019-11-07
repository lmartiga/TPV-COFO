import { CategSubtotalInforme } from './CategSubtotalInforme';

export interface InformeVentasCategoriasPrintFin {
    Fecha: String;
    TotalDiaList: number;
    ListCategSubtotal: CategSubtotalInforme [];
}
