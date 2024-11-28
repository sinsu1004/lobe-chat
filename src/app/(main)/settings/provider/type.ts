import { ProviderConfigProps } from './features/ProviderConfig';

export interface ProviderItem extends Omit<ProviderConfigProps, 'id'> {
  id: string;
}
