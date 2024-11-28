// @vitest-environment node
import { eq } from 'drizzle-orm/expressions';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { getTestDBInstance } from '@/database/server/core/dbForTest';

import { NewAiProviderItem, aiProviders, users } from '../../../schemas';
import { AiProviderModel } from '../aiProvider';

let serverDB = await getTestDBInstance();

const userId = 'session-group-model-test-user-id';
const aiProviderModel = new AiProviderModel(serverDB, userId);

beforeEach(async () => {
  await serverDB.delete(users);
  await serverDB.insert(users).values([{ id: userId }, { id: 'user2' }]);
});

afterEach(async () => {
  await serverDB.delete(users).where(eq(users.id, userId));
  await serverDB.delete(aiProviders).where(eq(aiProviders.userId, userId));
});

describe('AiProviderModel', () => {
  describe('create', () => {
    it('should create a new ai provider', async () => {
      const params = {
        name: 'AiHubMix',
        id: 'aihubmix',
      } as const;

      const result = await aiProviderModel.create(params);
      expect(result.id).toBeDefined();
      expect(result).toMatchObject({ ...params, userId });

      const group = await serverDB.query.aiProviders.findFirst({
        where: eq(aiProviders.id, result.id),
      });
      expect(group).toMatchObject({ ...params, userId });
    });
  });
  describe('delete', () => {
    it('should delete a ai provider by id', async () => {
      const { id } = await aiProviderModel.create({ name: 'AiHubMix', id: 'aihubmix' });

      await aiProviderModel.delete(id);

      const group = await serverDB.query.aiProviders.findFirst({
        where: eq(aiProviders.id, id),
      });
      expect(group).toBeUndefined();
    });
  });
  describe('deleteAll', () => {
    it('should delete all ai providers for the user', async () => {
      await aiProviderModel.create({ name: 'AiHubMix', id: 'aihubmix' });
      await aiProviderModel.create({ name: 'AiHubMix', id: 'aihubmix-2' });

      await aiProviderModel.deleteAll();

      const userGroups = await serverDB.query.aiProviders.findMany({
        where: eq(aiProviders.userId, userId),
      });
      expect(userGroups).toHaveLength(0);
    });
    it('should only delete ai providers for the user, not others', async () => {
      await aiProviderModel.create({ name: 'AiHubMix', id: 'aihubmix' });
      await aiProviderModel.create({ name: 'AiHubMix', id: 'aihubmix-2' });

      const anotherAiProviderModel = new AiProviderModel(serverDB, 'user2');
      await anotherAiProviderModel.create({ id: 'aihubmix', name: 'Another provider' });

      await aiProviderModel.deleteAll();

      const userGroups = await serverDB.query.aiProviders.findMany({
        where: eq(aiProviders.userId, userId),
      });
      const total = await serverDB.query.aiProviders.findMany();
      expect(userGroups).toHaveLength(0);
      expect(total).toHaveLength(1);
    });
  });

  describe('query', () => {
    it('should query ai providers for the user', async () => {
      await aiProviderModel.create({ name: 'AiHubMix', id: 'aihubmix' });
      await aiProviderModel.create({ name: 'AiHubMix', id: 'aihubmix-2' });

      const userGroups = await aiProviderModel.query();
      expect(userGroups).toHaveLength(2);
      expect(userGroups[0].id).toBe('aihubmix-2');
      expect(userGroups[1].id).toBe('aihubmix');
    });
  });

  describe('findById', () => {
    it('should find a ai provider by id', async () => {
      const { id } = await aiProviderModel.create({ name: 'AiHubMix', id: 'aihubmix' });

      const group = await aiProviderModel.findById(id);
      expect(group).toMatchObject({
        id,
        name: 'AiHubMix',
        userId,
      });
    });
  });

  describe('update', () => {
    it('should update a ai provider', async () => {
      const { id } = await aiProviderModel.create({ name: 'AiHubMix', id: 'aihubmix' });

      await aiProviderModel.update(id, { name: 'Updated Test Group', sort: 3 });

      const updatedGroup = await serverDB.query.aiProviders.findFirst({
        where: eq(aiProviders.id, id),
      });
      expect(updatedGroup).toMatchObject({
        id,
        name: 'Updated Test Group',
        sort: 3,
        userId,
      });
    });
  });

  describe('updateOrder', () => {
    it('should update order of ai providers', async () => {
      const group1 = await aiProviderModel.create({ name: 'AiHubMix', id: 'aihubmix' });
      const group2 = await aiProviderModel.create({ name: 'AiHubMix', id: 'aihubmix-2' });

      await aiProviderModel.updateOrder([
        { id: group1.id, sort: 3 },
        { id: group2.id, sort: 4 },
      ]);

      const updatedGroup1 = await serverDB.query.aiProviders.findFirst({
        where: eq(aiProviders.id, group1.id),
      });
      const updatedGroup2 = await serverDB.query.aiProviders.findFirst({
        where: eq(aiProviders.id, group2.id),
      });

      expect(updatedGroup1?.sort).toBe(3);
      expect(updatedGroup2?.sort).toBe(4);
    });
  });
});
