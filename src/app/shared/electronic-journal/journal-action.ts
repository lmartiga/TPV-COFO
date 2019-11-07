import { ActionType } from 'app/shared/electronic-journal/action-type.enum';

export interface JournalAction {
  type: ActionType;
  operatorName?: string;
  localDateTime?: string; // Se aplicó el formateo a string desde Date

  operatorCode?: string;
  customerCode?: string;
  previousDocument?: string;
  selectedDocument?: string;
  quantity?: string;
  price?: string;
  discount?: string;
  amount?: string;
  newPrice?: string;
  newDiscount?: string;
  newQuantity?: string;
  newAmount?: string;
  authorizerCode?: string;
  paymentDescription?: string;
  paymentMode?: number;
  paymentFlow?: number;
  documentNumber?: string;
  fuellingPointCode?: string;
  newFuellingPointCode?: string;
  buttonCaption?: string;
  operationMode?: string;

  gradeId?: string;
  productId?: string;
  barCode?: string;

  idAlert?: string;
  alertType?: string;
  timesShown?: string;

  tPVToken?: string;

  genericDetail?: string;
}
