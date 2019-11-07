import { ListaMediosPago } from './ListaMediosPago';

export interface InformeVentasRecaudacion {
    Fecha: Date;
    ListaMedios: Array<ListaMediosPago>;
}
