import { serverFeatureFlags } from '@/config/featureFlags';
import { OpenAIProviderCard } from '@/config/modelProviders';

import ProviderDetail from '../[id]';

const Page = async () => {
  const { showOpenAIProxyUrl, showOpenAIApiKey } = serverFeatureFlags();

  return (
    <ProviderDetail
      {...OpenAIProviderCard}
      config={{
        ...OpenAIProviderCard.config,
        proxyUrl: showOpenAIProxyUrl && {
          placeholder: 'https://api.openai.com/v1',
        },
        showApiKey: showOpenAIApiKey,
      }}
    />
  );
};

export default Page;
