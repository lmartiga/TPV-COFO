import { LineListVentasCategorias } from 'app/shared/document/LineListVentasCategorias';

export interface InformeVentasCategorias {
    CategoriaName: string;
    CategoriaId: string;
    ListaLineas: LineListVentasCategorias[];
}
