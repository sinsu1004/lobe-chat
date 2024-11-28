import { serverFeatureFlags } from '@/config/featureFlags';
import { OpenAIProviderCard } from '@/config/modelProviders';

import ProviderDetail from '../[id]';

const Page = async () => {
  const { showOpenAIProxyUrl, showOpenAIApiKey } = serverFeatureFlags();
  const card = {
    ...OpenAIProviderCard,
    proxyUrl: showOpenAIProxyUrl && {
      placeholder: 'https://api.openai.com/v1',
    },
    showApiKey: showOpenAIApiKey,
  };

  return <ProviderDetail {...card} />;
};

export default Page;
