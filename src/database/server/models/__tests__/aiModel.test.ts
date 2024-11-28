// @vitest-environment node
import { eq } from 'drizzle-orm/expressions';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { getTestDBInstance } from '@/database/server/core/dbForTest';

import { NewAiModelItem, aiModels, users } from '../../../schemas';
import { AiModelModel } from '../aiModel';

let serverDB = await getTestDBInstance();

const userId = 'ai-model-test-user-id';
const aiProviderModel = new AiModelModel(serverDB, userId);

beforeEach(async () => {
  await serverDB.delete(users);
  await serverDB.insert(users).values([{ id: userId }, { id: 'user2' }]);
});

afterEach(async () => {
  await serverDB.delete(users).where(eq(users.id, userId));
  await serverDB.delete(aiModels).where(eq(aiModels.userId, userId));
});

describe('AiModelModel', () => {
  describe('create', () => {
    it('should create a new ai provider', async () => {
      const params: NewAiModelItem = {
        organization: 'Qwen',
        id: 'qvq',
        providerId: 'openai',
      };

      const result = await aiProviderModel.create(params);
      expect(result.id).toBeDefined();
      expect(result).toMatchObject({ ...params, userId });

      const group = await serverDB.query.aiModels.findFirst({
        where: eq(aiModels.id, result.id),
      });
      expect(group).toMatchObject({ ...params, userId });
    });
  });
  describe('delete', () => {
    it('should delete a ai provider by id', async () => {
      const { id } = await aiProviderModel.create({
        organization: 'Qwen',
        providerId: 'openai',
        id: 'qvq',
      });

      await aiProviderModel.delete(id, 'openai');

      const group = await serverDB.query.aiModels.findFirst({
        where: eq(aiModels.id, id),
      });
      expect(group).toBeUndefined();
    });
  });
  describe('deleteAll', () => {
    it('should delete all ai providers for the user', async () => {
      await aiProviderModel.create({ organization: 'Qwen', providerId: 'openai', id: 'qvq' });
      await aiProviderModel.create({
        organization: 'Qwen',
        providerId: 'openai',
        id: 'aihubmix-2',
      });

      await aiProviderModel.deleteAll();

      const userGroups = await serverDB.query.aiModels.findMany({
        where: eq(aiModels.userId, userId),
      });
      expect(userGroups).toHaveLength(0);
    });
    it('should only delete ai providers for the user, not others', async () => {
      await aiProviderModel.create({ organization: 'Qwen', providerId: 'openai', id: 'qvq' });
      await aiProviderModel.create({
        organization: 'Qwen',
        providerId: 'openai',
        id: 'aihubmix-2',
      });

      const anotherAiModelModel = new AiModelModel(serverDB, 'user2');
      await anotherAiModelModel.create({ id: 'qvq', providerId: 'openai' });

      await aiProviderModel.deleteAll();

      const userGroups = await serverDB.query.aiModels.findMany({
        where: eq(aiModels.userId, userId),
      });
      const total = await serverDB.query.aiModels.findMany();
      expect(userGroups).toHaveLength(0);
      expect(total).toHaveLength(1);
    });
  });

  describe('query', () => {
    it('should query ai providers for the user', async () => {
      await aiProviderModel.create({ organization: 'Qwen', providerId: 'openai', id: 'qvq' });
      await aiProviderModel.create({
        organization: 'Qwen',
        providerId: 'openai',
        id: 'aihubmix-2',
      });

      const userGroups = await aiProviderModel.query();
      expect(userGroups).toHaveLength(2);
      expect(userGroups[0].id).toBe('aihubmix-2');
      expect(userGroups[1].id).toBe('qvq');
    });
  });

  describe('findById', () => {
    it('should find a ai provider by id', async () => {
      const { id } = await aiProviderModel.create({
        organization: 'Qwen',
        providerId: 'openai',
        id: 'qvq',
      });

      const group = await aiProviderModel.findById(id);
      expect(group).toMatchObject({
        id,
        organization: 'Qwen',
        providerId: 'openai',

        userId,
      });
    });
  });

  describe('update', () => {
    it('should update a ai provider', async () => {
      const { id } = await aiProviderModel.create({
        organization: 'Qwen',
        providerId: 'openai',
        id: 'qvq',
      });

      await aiProviderModel.update(id, 'openai', {
        displayName: 'Updated Test Group',
        contextWindowTokens: 3000,
      });

      const updatedGroup = await serverDB.query.aiModels.findFirst({
        where: eq(aiModels.id, id),
      });
      expect(updatedGroup).toMatchObject({
        id,
        displayName: 'Updated Test Group',
        contextWindowTokens: 3000,
        userId,
      });
    });
  });
});
