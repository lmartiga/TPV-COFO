import { Posinformation } from 'app/shared/posinformation';
import { GetPosInformationStatus } from 'app/shared/hubble-pos-web-api-responses/get-pos-information/get-pos-information-status.enum';

export interface GetPosInformationResponse {
    status: GetPosInformationStatus;
    message: string;
    posInformation: Posinformation;
}
