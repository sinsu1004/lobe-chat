import { and, asc, desc, eq, inArray } from 'drizzle-orm/expressions';

import { LobeChatDatabase } from '@/database/type';
import {
  AiModelSortMap,
  AiModelSourceEnum,
  AiProviderModelListItem,
  ToggleAiModelEnableParams,
} from '@/types/aiModel';

import { AiModelSelectItem, NewAiModelItem, aiModels } from '../../schemas';

export class AiModelModel {
  private userId: string;
  private db: LobeChatDatabase;

  constructor(db: LobeChatDatabase, userId: string) {
    this.userId = userId;
    this.db = db;
  }

  create = async (params: NewAiModelItem) => {
    const [result] = await this.db
      .insert(aiModels)
      .values({
        ...params,
        enabled: true, // enabled by default
        source: AiModelSourceEnum.Custom,
        userId: this.userId,
      })
      .returning();

    return result;
  };

  delete = async (id: string, providerId: string) => {
    return this.db
      .delete(aiModels)
      .where(
        and(
          eq(aiModels.id, id),
          eq(aiModels.providerId, providerId),
          eq(aiModels.userId, this.userId),
        ),
      );
  };

  deleteAll = async () => {
    return this.db.delete(aiModels).where(eq(aiModels.userId, this.userId));
  };

  query = async () => {
    return this.db.query.aiModels.findMany({
      orderBy: [desc(aiModels.updatedAt)],
      where: eq(aiModels.userId, this.userId),
    });
  };

  getModelListByProviderId = async (providerId: string) => {
    const result = await this.db
      .select({
        abilities: aiModels.abilities,
        contextWindowTokens: aiModels.contextWindowTokens,
        description: aiModels.description,
        displayName: aiModels.displayName,
        enabled: aiModels.enabled,
        id: aiModels.id,
        pricing: aiModels.pricing,
        source: aiModels.source,
        type: aiModels.type,
      })
      .from(aiModels)
      .where(and(eq(aiModels.providerId, providerId), eq(aiModels.userId, this.userId)))
      .orderBy(
        asc(aiModels.sort),
        desc(aiModels.enabled),
        desc(aiModels.releasedAt),
        desc(aiModels.updatedAt),
      );

    return result as AiProviderModelListItem[];
  };

  findById = async (id: string) => {
    return this.db.query.aiModels.findFirst({
      where: and(eq(aiModels.id, id), eq(aiModels.userId, this.userId)),
    });
  };

  update = async (id: string, providerId: string, value: Partial<AiModelSelectItem>) => {
    return this.db
      .insert(aiModels)
      .values({ ...value, id, providerId, updatedAt: new Date(), userId: this.userId })
      .onConflictDoUpdate({
        set: value,
        target: [aiModels.id, aiModels.providerId, aiModels.userId],
      });
  };

  toggleModelEnabled = async (value: ToggleAiModelEnableParams) => {
    return this.db
      .insert(aiModels)
      .values({ ...value, updatedAt: new Date(), userId: this.userId })
      .onConflictDoUpdate({
        set: { enabled: value.enabled, updatedAt: new Date() },
        target: [aiModels.id, aiModels.providerId, aiModels.userId],
      });
  };

  batchUpdateAiModels = async (providerId: string, models: AiModelSelectItem[]) => {
    return this.db.transaction(async (trx) => {
      const records = models.map(({ id, providerId: _, ...model }) => ({
        ...model,
        id,
        providerId,
        updatedAt: new Date(),
        userId: this.userId,
      }));

      // 第一步：尝试插入所有记录，忽略冲突
      const insertResult = await trx
        .insert(aiModels)
        .values(records)
        .onConflictDoNothing({
          target: [aiModels.id, aiModels.userId, aiModels.providerId],
        });

      // 第二步：找出需要更新的记录（即插入时发生冲突的记录）
      const recordIds = records.map((r) => r.id);
      const existingRecords = await trx
        .select()
        .from(aiModels)
        .where(
          and(
            inArray(aiModels.id, recordIds),
            eq(aiModels.userId, this.userId),
            eq(aiModels.providerId, providerId),
          ),
        );

      const existingIds = new Set(existingRecords.map((r) => r.id));
      const recordsToUpdate = records.filter((r) => existingIds.has(r.id));

      // 第三步：更新已存在的记录
      if (recordsToUpdate.length > 0) {
        const updatePromises = recordsToUpdate.map((record) =>
          trx
            .update(aiModels)
            .set({
              abilities: record.abilities,
              config: record.config,
              contextWindowTokens: record.contextWindowTokens,
              description: record.description,
              displayName: record.displayName,
              enabled: record.enabled,
              organization: record.organization,
              parameters: record.parameters,
              pricing: record.pricing,
              releasedAt: record.releasedAt,
              sort: record.sort,
              source: record.source,
              type: record.type,
              updatedAt: new Date(),
            })
            .where(
              and(
                eq(aiModels.id, record.id),
                eq(aiModels.userId, this.userId),
                eq(aiModels.providerId, providerId),
              ),
            ),
        );

        await Promise.all(updatePromises);
      }
    });
  };

  clearRemoteModels(providerId: string) {
    return this.db
      .delete(aiModels)
      .where(
        and(
          eq(aiModels.providerId, providerId),
          eq(aiModels.source, AiModelSourceEnum.Remote),
          eq(aiModels.userId, this.userId),
        ),
      );
  }

  updateModelsOrder = async (providerId: string, sortMap: AiModelSortMap[]) => {
    await this.db.transaction(async (tx) => {
      const updates = sortMap.map(({ id, sort }) => {
        return tx
          .insert(aiModels)
          .values({
            enabled: true,
            id,
            providerId,
            sort,
            // source: isBuiltin ? 'builtin' : 'custom',
            updatedAt: new Date(),
            userId: this.userId,
          })
          .onConflictDoUpdate({
            set: { sort, updatedAt: new Date() },
            target: [aiModels.id, aiModels.userId, aiModels.providerId],
          });
      });

      await Promise.all(updates);
    });
  };
}
