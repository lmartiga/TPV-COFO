import { PluProduct } from 'app/shared/plu/plu-product';
import { RGBColor } from 'app/shared/color/RGBColor';

export interface PluItem {
  groupId: string;
  description: string;
  productList: Array<PluProduct>;
  relativeOrder?: number;
  color?: RGBColor;
  ImageHtmlBase64String?: string;
  id?: any;
}
