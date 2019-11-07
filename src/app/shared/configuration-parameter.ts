import { ConfigurationParameterType } from 'app/shared/configuration-parameter-type.enum';

export interface ConfigurationParameter {
  id: number;
  type: ConfigurationParameterType;
  name: string;
  description: string;
  groupName: string;
  defaultLevelStringValue: string;
  companyLevelStringValue: string;
  shopLevelStringValue: string;
  posLevelStringValue: string;
  meaningfulStringValue: string;
}
