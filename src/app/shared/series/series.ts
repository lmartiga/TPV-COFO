import { SeriesType } from 'app/shared/series/series-type';
export interface Series {
    /// Indica el tipo de serie que refiere
    type: SeriesType;
    /// Indica el SerieId
    id: string;
}
