import { IbusinessSpecificLine } from 'app/shared/ibusiness-specific-line';
import { DocumentLinePromotion } from 'app/shared/document/document-line-promotion';

export interface DocumentLine {
  productId: string;
  quantity: number;
  description: string;
  priceWithTax: number;
  priceWithoutTax?: number;
  originalPriceWithTax?: number;
  discountPercentage: number; // dto aplicado por el usuario
  taxPercentage?: number;
  discountAmountWithTax?: number;
  discountAmountWithoutTax?: number;
  taxAmount?: number;
  totalAmountWithTax?: number;
  appliedPromotionList?: Array<DocumentLinePromotion>;
  appliedPromotionListHTML?: Array<DocumentLinePromotion>;
  businessSpecificLineInfo?: IbusinessSpecificLine;
  isLoyaltyRedemption?: boolean;
  isPromotionCandidate?: boolean;
  isRemoved?: boolean;
  isEditable?: boolean;
  typeArticle?: string;
  isConsigna?: boolean;
  ticket?: number;
  coste?: number;
  modifPvp?: boolean;
  PVPLocal?: boolean;
  isPromoted?: boolean;
  idCategoria: string;
  nameCategoria: string;
  pricelocal?: number;
}

