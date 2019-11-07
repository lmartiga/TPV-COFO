import { Series } from 'app/shared/series/series';
import { GetSeriesResponseStatuses } from './get-series-response-statuses.enum';



export interface GetSeriesResponse {
  status: GetSeriesResponseStatuses;
  message: string;

  seriesList: Series[];
}
