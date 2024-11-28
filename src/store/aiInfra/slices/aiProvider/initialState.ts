import { AiProviderDetailItem, AiProviderListItem } from '@/types/aiProvider';

export interface AIProviderState {
  activeAiProvider?: string;
  activeProviderModelList: any[];
  aiProviderDetail?: AiProviderDetailItem | null;
  aiProviderKeyVaults: Record<string, object>;
  aiProviderList: AiProviderListItem[];
  aiProviderLoadingIds: string[];
  initAiProviderList: boolean;
  providerSearchKeyword: string;
}

export const initialAIProviderState: AIProviderState = {
  activeProviderModelList: [],
  aiProviderKeyVaults: {},
  aiProviderList: [],
  aiProviderLoadingIds: [],
  initAiProviderList: false,
  providerSearchKeyword: '',
};
