import { Company } from 'app/shared/company';
import {
  GetCompanyResponseStatuses
} from 'app/shared/web-api-responses/get-company-response-statuses.enum';

export interface GetCompanyResponse {
  status: GetCompanyResponseStatuses;
  message: string;

  company: Company;
}
