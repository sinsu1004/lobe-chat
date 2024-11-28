import { AIChatModelCard } from '@/types/aiModel';

const azureChatModels: AIChatModelCard[] = [
  {
    abilities: {
      functionCall: true,
    },
    contextWindowTokens: 16_385,
    deploymentName: 'gpt-35-turbo',
    description:
      'GPT 3.5 Turbo，OpenAI提供的高效模型，适用于聊天和文本生成任务，支持并行函数调用。',
    displayName: 'GPT 3.5 Turbo',
    enabled: true,
    id: 'gpt-35-turbo',
    maxOutput: 4096,
    type: 'chat',
  },
  {
    abilities: {
      functionCall: true,
    },
    contextWindowTokens: 16_384,
    deploymentName: 'gpt-35-turbo-16k',
    description: 'GPT 3.5 Turbo 16k，高容量文本生成模型，适合复杂任务。',
    displayName: 'GPT 3.5 Turbo',
    id: 'gpt-35-turbo-16k',
    maxOutput: 4096,
    type: 'chat',
  },
  {
    abilities: {
      functionCall: true,
      vision: true,
    },
    contextWindowTokens: 128_000,
    deploymentName: 'gpt-4-turbo',
    description: 'GPT 4 Turbo，多模态模型，提供杰出的语言理解和生成能力，同时支持图像输入。',
    displayName: 'GPT 4 Turbo',
    enabled: true,
    id: 'gpt-4',
    maxOutput: 4096,
    type: 'chat',
  },
  {
    abilities: {
      functionCall: true,
      vision: true,
    },
    contextWindowTokens: 128_000,
    deploymentName: 'gpt-4o-mini',
    description: 'GPT-4o Mini，小型高效模型，具备与GPT-4o相似的卓越性能。',
    displayName: 'GPT 4o Mini',
    enabled: true,
    id: 'gpt-4o-mini',
    maxOutput: 4096,
    type: 'chat',
  },
  {
    abilities: {
      functionCall: true,
      vision: true,
    },
    contextWindowTokens: 128_000,
    deploymentName: 'gpt-4o',
    description: 'GPT-4o 是最新的多模态模型，结合高级文本和图像处理能力。',
    displayName: 'GPT 4o',
    enabled: true,
    id: 'gpt-4o',
    maxOutput: 4096,
    type: 'chat',
  },
];

export const allModels = [...azureChatModels];

export default allModels;
