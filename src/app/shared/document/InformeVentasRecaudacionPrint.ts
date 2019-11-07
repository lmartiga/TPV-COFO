import { ListaMediosPago } from './ListaMediosPago';

export interface InformeVentasRecaudacionPrint {
    Fecha: String;
    ListaMedios: Array<ListaMediosPago>;
    TotalDiaRecaudacion: Number;
}
