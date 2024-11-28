import { z } from 'zod';

import { serverDB } from '@/database/server';
import { AiModelModel } from '@/database/server/models/aiModel';
import { UserModel } from '@/database/server/models/user';
import { authedProcedure, router } from '@/libs/trpc';
import { KeyVaultsGateKeeper } from '@/server/modules/KeyVaultsEncrypt';
import {
  AIChatModelCard,
  AiModelSourceEnum,
  AiProviderModelListItem,
  CreateAiModelSchema,
  ToggleAiModelEnableSchema,
  UpdateAiModelSchema,
} from '@/types/aiModel';
import { mergeArrayById } from '@/utils/merge';

const aiModelProcedure = authedProcedure.use(async (opts) => {
  const { ctx } = opts;

  const gateKeeper = await KeyVaultsGateKeeper.initWithEnvKey();

  return opts.next({
    ctx: {
      aiModelModel: new AiModelModel(serverDB, ctx.userId),
      gateKeeper,
      userModel: new UserModel(serverDB, ctx.userId),
    },
  });
});

export const aiModelRouter = router({
  batchUpdateAiModels: aiModelProcedure
    .input(
      z.object({
        id: z.string(),
        models: z.array(z.any()),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      return ctx.aiModelModel.batchUpdateAiModels(input.id, input.models);
    }),

  clearRemoteModels: aiModelProcedure
    .input(z.object({ providerId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      return ctx.aiModelModel.clearRemoteModels(input.providerId);
    }),

  createAiModel: aiModelProcedure.input(CreateAiModelSchema).mutation(async ({ input, ctx }) => {
    const data = await ctx.aiModelModel.create(input);

    return data?.id;
  }),

  getAiModelById: aiModelProcedure
    .input(z.object({ id: z.string() }))

    .query(async ({ input, ctx }) => {
      return ctx.aiModelModel.findById(input.id);
    }),

  // getAiModelList: aiModelProcedure.query(async ({ ctx }) => {
  //   const { languageModel } = getServerGlobalConfig();
  //   const userSettings = await ctx.userModel.getUserSettings();
  //   const mergedLanguageModel = merge(languageModel, userSettings?.languageModel || {}) as Record<
  //     string,
  //     ProviderConfig
  //   >;
  //
  //   const userProviders = await ctx.aiModelModel.getAiModelList();
  //
  //   const builtinProviders = DEFAULT_MODEL_PROVIDER_LIST.map((item) => ({
  //     description: item.description,
  //     enabled:
  //       userProviders.some((provider) => provider.id === item.id && provider.enabled) ||
  //       mergedLanguageModel[item.id]?.enabled,
  //     id: item.id,
  //     name: item.name,
  //     source: 'builtin',
  //   })) as AiModelListItem[];
  //
  //   return uniqBy([...builtinProviders, ...userProviders], 'id');
  // }),

  getAiProviderModelList: aiModelProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const aiModels = await ctx.aiModelModel.getModelListByProviderId(input.id);

      let defaultModels: AiProviderModelListItem[] = [];
      try {
        const { default: providerModels } = await import(`@/config/aiModels/${input.id}`);
        defaultModels = (providerModels as AIChatModelCard[]).map<AiProviderModelListItem>((m) => ({
          ...m,
          enabled: m.enabled || false,
          source: AiModelSourceEnum.Builtin,
        }));
      } catch {
        // maybe provider id not exist
      }

      return mergeArrayById(defaultModels, aiModels) as AiProviderModelListItem[];
    }),

  removeAiModel: aiModelProcedure
    .input(z.object({ id: z.string(), providerId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      return ctx.aiModelModel.delete(input.id, input.providerId);
    }),

  removeAllAiModels: aiModelProcedure.mutation(async ({ ctx }) => {
    return ctx.aiModelModel.deleteAll();
  }),

  toggleModelEnabled: aiModelProcedure
    .input(ToggleAiModelEnableSchema)
    .mutation(async ({ input, ctx }) => {
      return ctx.aiModelModel.toggleModelEnabled(input);
    }),

  updateAiModel: aiModelProcedure
    .input(
      z.object({
        id: z.string(),
        providerId: z.string(),
        value: UpdateAiModelSchema,
      }),
    )
    .mutation(async ({ input, ctx }) => {
      return ctx.aiModelModel.update(input.id, input.providerId, input.value);
    }),

  updateAiModelOrder: aiModelProcedure
    .input(
      z.object({
        providerId: z.string(),
        sortMap: z.array(
          z.object({
            id: z.string(),
            sort: z.number(),
          }),
        ),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      return ctx.aiModelModel.updateModelsOrder(input.providerId, input.sortMap);
    }),
});

export type AiModelRouter = typeof aiModelRouter;
