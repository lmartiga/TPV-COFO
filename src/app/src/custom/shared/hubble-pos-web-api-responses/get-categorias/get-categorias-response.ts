
import { GetCategoriasResponseStatuses } from './get-categorias-response-statuses.enum';
import { CategoriasData } from '../../shared-cierre-diferido/categorias-data';


export interface GetCategoriasResponse {
  status: GetCategoriasResponseStatuses;
  message: string;

  seriesList: CategoriasData[];
}
