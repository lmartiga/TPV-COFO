
import { CategoriasData } from '../shared-cierre-diferido/categorias-data';
import { GetCategoriasResponseStatuses } from '../hubble-pos-web-api-responses/get-categorias/get-categorias-response-statuses.enum';

export interface GetCategoriasResponse {
  status: GetCategoriasResponseStatuses;
  message: string;

  categoriasData: CategoriasData[];
}
