import { FuellingPointInfo } from 'app/shared/fuelling-point/fuelling-point-info';
import { GradeConfiguration } from 'app/shared/fuelling-point/grade-configuration';

export interface FuellingPointResponse {
    numFp: number;
    fuellingPoints: Array<FuellingPointInfo>;
    gradeList: Array<GradeConfiguration>;
}
