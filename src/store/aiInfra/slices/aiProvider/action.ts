import { uniqBy } from 'lodash-es';
import { SWRResponse, mutate } from 'swr';
import { StateCreator } from 'zustand/vanilla';

import { isDeprecatedEdition } from '@/const/version';
import { useClientDataSWR } from '@/libs/swr';
import { aiProviderService } from '@/services/aiProvider';
import { AiInfraStore } from '@/store/aiInfra/store';
import { ModelAbilities } from '@/types/aiModel';
import {
  AiProviderDetailItem,
  AiProviderInitState,
  AiProviderListItem,
  AiProviderSortMap,
  AiProviderSourceEnum,
  CreateAiProviderParams,
  UpdateAiProviderConfigParams,
  UpdateAiProviderParams,
} from '@/types/aiProvider';

const FETCH_AI_PROVIDER_LIST_KEY = 'FETCH_AI_PROVIDER';
const FETCH_AI_PROVIDER_ITEM_KEY = 'FETCH_AI_PROVIDER_ITEM';
const FETCH_ENABLED_AI_PROVIDER_KEY_VAULTS_KEY = 'FETCH_ENABLED_AI_PROVIDER_KEY_VAULTS';

export interface AiProviderAction {
  createNewAiProvider: (params: CreateAiProviderParams) => Promise<void>;
  deleteAiProvider: (id: string) => Promise<void>;
  internal_toggleAiProviderLoading: (id: string, loading: boolean) => void;
  refreshAiProviderDetail: () => Promise<void>;
  refreshAiProviderKeyVaults: () => Promise<void>;
  refreshAiProviderList: () => Promise<void>;
  removeAiProvider: (id: string) => Promise<void>;
  toggleProviderEnabled: (id: string, enabled: boolean) => Promise<void>;
  updateAiProvider: (id: string, value: UpdateAiProviderParams) => Promise<void>;
  updateAiProviderConfig: (id: string, value: UpdateAiProviderConfigParams) => Promise<void>;
  updateAiProviderSort: (items: AiProviderSortMap[]) => Promise<void>;

  useFetchAiProviderItem: (id: string) => SWRResponse<AiProviderDetailItem | undefined>;
  useFetchAiProviderList: (params?: { suspense?: boolean }) => SWRResponse<AiProviderListItem[]>;
  /**
   * init provider keyVaults and user enabled model list
   * @param isLoginOnInit
   */
  useInitAiProviderKeyVaults: (
    isLoginOnInit: boolean | undefined,
  ) => SWRResponse<AiProviderInitState | undefined>;
}

export const createAiProviderSlice: StateCreator<
  AiInfraStore,
  [['zustand/devtools', never]],
  [],
  AiProviderAction
> = (set, get) => ({
  createNewAiProvider: async (params) => {
    await aiProviderService.createAiProvider({ ...params, source: AiProviderSourceEnum.Custom });
    await get().refreshAiProviderList();
  },
  deleteAiProvider: async (id: string) => {
    await aiProviderService.deleteAiProvider(id);

    await get().refreshAiProviderList();
  },
  internal_toggleAiProviderLoading: (id, loading) => {
    set(
      (state) => {
        if (loading) return { aiProviderLoadingIds: [...state.aiProviderLoadingIds, id] };

        return { aiProviderLoadingIds: state.aiProviderLoadingIds.filter((i) => i !== id) };
      },
      false,
      'toggleAiProviderLoading',
    );
  },
  refreshAiProviderDetail: async () => {
    await mutate([FETCH_AI_PROVIDER_ITEM_KEY, get().activeAiProvider]);
    await get().refreshAiProviderKeyVaults();
  },
  refreshAiProviderKeyVaults: async () => {
    await mutate(FETCH_ENABLED_AI_PROVIDER_KEY_VAULTS_KEY);
  },
  refreshAiProviderList: async () => {
    await mutate(FETCH_AI_PROVIDER_LIST_KEY);
  },
  removeAiProvider: async (id) => {
    await aiProviderService.deleteAiProvider(id);
    await get().refreshAiProviderList();
  },

  toggleProviderEnabled: async (id: string, enabled: boolean) => {
    get().internal_toggleAiProviderLoading(id, true);
    await aiProviderService.toggleProviderEnabled(id, enabled);
    await get().refreshAiProviderList();

    get().internal_toggleAiProviderLoading(id, false);
  },

  updateAiProvider: async (id, value) => {
    get().internal_toggleAiProviderLoading(id, true);
    await aiProviderService.updateAiProvider(id, value);
    await get().refreshAiProviderList();
    await get().refreshAiProviderDetail();

    get().internal_toggleAiProviderLoading(id, false);
  },

  updateAiProviderConfig: async (id, value) => {
    get().internal_toggleAiProviderLoading(id, true);
    await aiProviderService.updateAiProviderConfig(id, value);
    await get().refreshAiProviderDetail();

    get().internal_toggleAiProviderLoading(id, false);
  },

  updateAiProviderSort: async (items) => {
    await aiProviderService.updateAiProviderOrder(items);
    await get().refreshAiProviderList();
  },
  useFetchAiProviderItem: (id) =>
    useClientDataSWR<AiProviderDetailItem | undefined>(
      [FETCH_AI_PROVIDER_ITEM_KEY, id],
      () => aiProviderService.getAiProviderById(id),
      {
        onSuccess: (data) => {
          if (!data) return;

          set({ activeAiProvider: id, aiProviderDetail: data }, false, 'useFetchAiProviderItem');
        },
      },
    ),
  useFetchAiProviderList: () =>
    useClientDataSWR<AiProviderListItem[]>(
      FETCH_AI_PROVIDER_LIST_KEY,
      () => aiProviderService.getAiProviderList(),
      {
        fallbackData: [],
        onSuccess: (data) => {
          if (!get().initAiProviderList) {
            set(
              { aiProviderList: data, initAiProviderList: true },
              false,
              'useFetchAiProviderList/init',
            );
            return;
          }

          set({ aiProviderList: data }, false, 'useFetchAiProviderList/refresh');
        },
      },
    ),

  useInitAiProviderKeyVaults: (isLoginOnInit) =>
    useClientDataSWR<AiProviderInitState | undefined>(
      isLoginOnInit && !isDeprecatedEdition ? [FETCH_ENABLED_AI_PROVIDER_KEY_VAULTS_KEY] : null,
      () => aiProviderService.initAiProvidersState(),
      {
        onSuccess: (data) => {
          if (!data) return;

          const getModelListByType = (providerId: string, type: string) => {
            const models = data.enabledAiModels
              .filter((model) => model.providerId === providerId && model.type === type)
              .map((model) => ({
                abilities: (model.abilities || {}) as ModelAbilities,
                contextWindowTokens: model.contextWindowTokens,
                displayName: model.displayName ?? '',
                id: model.id,
              }));

            return uniqBy(models, 'id');
          };

          // 3. 组装最终数据结构
          const enabledChatModelList = data.enabledAiProviders.map((provider) => ({
            children: getModelListByType(provider.id, 'chat'),
            id: provider.id,
            name: provider.name || provider.id,
          }));

          console.log(enabledChatModelList);

          set(
            {
              aiProviderKeyVaults: data.keyVaults,
              enabledAiModels: data.enabledAiModels,
              enabledAiProviders: data.enabledAiProviders,
              enabledChatModelList,
            },
            false,
            'useInitAiProviderKeyVaults',
          );
        },
      },
    ),
});
