import { PreparePresetOperationStatus } from 'app/shared/hubble-pos-signalr-responses/prepare-preset-operation-status.enum';

export interface PreparePresetOperationResponse {
    status: PreparePresetOperationStatus;
    message: string;
}
