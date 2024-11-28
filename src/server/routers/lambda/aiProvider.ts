import { z } from 'zod';

import { DEFAULT_MODEL_PROVIDER_LIST } from '@/config/modelProviders';
import { serverDB } from '@/database/server';
import { AiProviderModel } from '@/database/server/models/aiProvider';
import { UserModel } from '@/database/server/models/user';
import { authedProcedure, router } from '@/libs/trpc';
import { getServerGlobalConfig } from '@/server/globalConfig';
import { KeyVaultsGateKeeper } from '@/server/modules/KeyVaultsEncrypt';
import {
  AiProviderDetailItem,
  AiProviderListItem,
  CreateAiProviderSchema,
  UpdateAiProviderConfigSchema,
} from '@/types/aiProvider';
import { ProviderConfig } from '@/types/user/settings';
import { merge, mergeArrayById } from '@/utils/merge';

const aiProviderProcedure = authedProcedure.use(async (opts) => {
  const { ctx } = opts;

  const gateKeeper = await KeyVaultsGateKeeper.initWithEnvKey();

  return opts.next({
    ctx: {
      aiProviderModel: new AiProviderModel(serverDB, ctx.userId),
      gateKeeper,
      userModel: new UserModel(serverDB, ctx.userId),
    },
  });
});

export const aiProviderRouter = router({
  createAiProvider: aiProviderProcedure
    .input(CreateAiProviderSchema)
    .mutation(async ({ input, ctx }) => {
      const data = await ctx.aiProviderModel.create(input, ctx.gateKeeper.encrypt);

      return data?.id;
    }),

  getAiProviderById: aiProviderProcedure
    .input(z.object({ id: z.string() }))

    .query(async ({ input, ctx }): Promise<AiProviderDetailItem> => {
      return ctx.aiProviderModel.getAiProviderById(input.id, KeyVaultsGateKeeper.getUserKeyVaults);
    }),

  getAiProviderKeyVaults: aiProviderProcedure.query(async ({ ctx }) => {
    return ctx.aiProviderModel.getAiProviderKeyVaults(KeyVaultsGateKeeper.getUserKeyVaults);
  }),

  getAiProviderList: aiProviderProcedure.query(async ({ ctx }) => {
    const { languageModel } = getServerGlobalConfig();
    const userSettings = await ctx.userModel.getUserSettings();
    const mergedLanguageModel = merge(languageModel, userSettings?.languageModel || {}) as Record<
      string,
      ProviderConfig
    >;

    const userProviders = await ctx.aiProviderModel.getAiProviderList();
    // 1. 先创建一个基于 DEFAULT_MODEL_PROVIDER_LIST id 顺序的映射
    const orderMap = new Map(DEFAULT_MODEL_PROVIDER_LIST.map((item, index) => [item.id, index]));

    const builtinProviders = DEFAULT_MODEL_PROVIDER_LIST.map((item) => ({
      description: item.description,
      enabled:
        userProviders.some((provider) => provider.id === item.id && provider.enabled) ||
        mergedLanguageModel[item.id]?.enabled,
      id: item.id,
      name: item.name,
      source: 'builtin',
    })) as AiProviderListItem[];

    const mergedProviders = mergeArrayById(builtinProviders, userProviders);

    // 3. 根据 orderMap 排序
    const sortedProviders = mergedProviders.sort((a, b) => {
      const orderA = orderMap.get(a.id) ?? Number.MAX_SAFE_INTEGER;
      const orderB = orderMap.get(b.id) ?? Number.MAX_SAFE_INTEGER;
      return orderA - orderB;
    });

    return sortedProviders;
  }),

  removeAiProvider: aiProviderProcedure
    .input(z.object({ id: z.string(), removeModels: z.boolean().optional() }))
    .mutation(async ({ input, ctx }) => {
      return ctx.aiProviderModel.delete(input.id);
    }),

  removeAllAiProviders: aiProviderProcedure.mutation(async ({ ctx }) => {
    return ctx.aiProviderModel.deleteAll();
  }),

  toggleProviderEnabled: aiProviderProcedure
    .input(
      z.object({
        enabled: z.boolean(),
        id: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      return ctx.aiProviderModel.toggleProviderEnabled(input.id, input.enabled);
    }),

  updateAiProvider: aiProviderProcedure
    .input(
      z.object({
        id: z.string(),
        value: CreateAiProviderSchema.partial(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      return ctx.aiProviderModel.update(input.id, input.value);
    }),

  updateAiProviderConfig: aiProviderProcedure
    .input(
      z.object({
        id: z.string(),
        value: UpdateAiProviderConfigSchema,
      }),
    )
    .mutation(async ({ input, ctx }) => {
      return ctx.aiProviderModel.updateConfig(input.id, input.value, ctx.gateKeeper.encrypt);
    }),

  updateAiProviderOrder: aiProviderProcedure
    .input(
      z.object({
        sortMap: z.array(
          z.object({
            id: z.string(),
            sort: z.number(),
          }),
        ),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      return ctx.aiProviderModel.updateOrder(input.sortMap);
    }),
});

export type AiProviderRouter = typeof aiProviderRouter;
