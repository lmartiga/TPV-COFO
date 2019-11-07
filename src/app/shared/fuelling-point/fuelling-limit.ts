import { FuellingLimitType } from 'app/shared/fuelling-point/fuelling-limit-type.enum';

export interface FuellingLimit {
    type: FuellingLimitType;
    value: number;
}
