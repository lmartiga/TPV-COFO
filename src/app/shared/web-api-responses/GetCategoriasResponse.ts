import { Categorias } from 'app/shared/web-api-responses/Categorias';

export interface GetCategoriasResponse {
    CategoriasList: Array<Categorias>;
}
