import { EnabledProviderWithModels } from '@/types/aiModel';
import {
  AiProviderDetailItem,
  AiProviderListItem,
  EnabledAiModel,
  EnabledProvider,
} from '@/types/aiProvider';

export interface AIProviderState {
  activeAiProvider?: string;
  activeProviderModelList: any[];
  aiProviderDetail?: AiProviderDetailItem | null;
  aiProviderKeyVaults: Record<string, object>;
  aiProviderList: AiProviderListItem[];
  aiProviderLoadingIds: string[];
  enabledAiModels?: EnabledAiModel[];
  enabledAiProviders?: EnabledProvider[];
  // used for select
  enabledChatModelList?: EnabledProviderWithModels[];
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
