'use client';

import isEqual from 'fast-deep-equal';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Flexbox } from 'react-layout-kit';

import { aiModelSelectors, useAiInfraStore } from '@/store/aiInfra';

import ModelItem from './ModelItem';

const SearchResult = memo(() => {
  const { t } = useTranslation('modelProvider');

  const searchKeyword = useAiInfraStore((s) => s.modelSearchKeyword);
  const filteredProviders = useAiInfraStore(aiModelSelectors.filteredAiProviderModelList, isEqual);

  return (
    <Flexbox gap={4} padding={'0 12px'}>
      {searchKeyword && filteredProviders.length === 0 ? (
        <Flexbox align="center" justify="center" padding={16}>
          {t('providerModels.searchNotFound')}
        </Flexbox>
      ) : (
        filteredProviders.map((item) => <ModelItem {...item} key={item.id} />)
      )}
    </Flexbox>
  );
});

export default SearchResult;
