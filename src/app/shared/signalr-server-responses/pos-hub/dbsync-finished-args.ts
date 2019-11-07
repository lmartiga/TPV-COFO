export interface DBSyncFinishedArgs {
  synchronizationProcessName: string;
  isSuccessful: boolean;
  errorMessage: string;
}
