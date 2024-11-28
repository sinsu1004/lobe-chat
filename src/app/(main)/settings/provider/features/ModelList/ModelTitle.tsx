import { ActionIcon, Icon } from '@lobehub/ui';
import {Button, Input, Skeleton, Space, Typography} from 'antd';
import { useTheme } from 'antd-style';
import { CircleX, LucideRefreshCcwDot, PlusIcon, SearchIcon } from 'lucide-react';
import { memo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Flexbox } from 'react-layout-kit';

import { useAiInfraStore } from '@/store/aiInfra';
import { aiModelSelectors } from '@/store/aiInfra/selectors';

import CreateNewModelModal from './CreateNewModelModal';

interface ModelFetcherProps {
  provider: string;
}

const ModelTitle = memo<ModelFetcherProps>(({ provider }) => {
  const theme = useTheme();
  const { t } = useTranslation('setting');
  const [
    searchKeyword,
    totalModels,
    hasRemoteModels,
    fetchRemoteModelList,
    clearObtainedModels,
    useFetchAiProviderModels,
  ] = useAiInfraStore((s) => [
    s.modelSearchKeyword,
    aiModelSelectors.totalAiProviderModelList(s),
    aiModelSelectors.hasRemoteModels(s),
    s.fetchRemoteModelList,
    s.clearRemoteModels,
    s.useFetchAiProviderModels,
  ]);

  const { isLoading } = useFetchAiProviderModels(provider);

  const [fetchRemoteModelsLoading, setFetchRemoteModelsLoading] = useState(false);
  const [clearRemoteModelsLoading, setClearRemoteModelsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);

  return (
    <Flexbox
      align={'center'}
      horizontal
      justify={'space-between'}
      paddingBlock={8}
      style={{ background: theme.colorBgLayout, position: 'sticky', top: -16, zIndex: 15 }}
    >
      <Flexbox align={'center'} gap={0} horizontal justify={'space-between'}>
        <Flexbox align={'center'} gap={8} horizontal>
          <Typography.Text style={{ fontSize: 16, fontWeight: 'bold' }}>模型列表</Typography.Text>

          {isLoading ? (
            <Skeleton.Button active style={{ height: 22 }} />
          ) : (
            <Typography.Text style={{ fontSize: 12 }} type={'secondary'}>
              <div style={{ display: 'flex', lineHeight: '24px' }}>
                {t('llm.modelList.total', { count: totalModels })}
                {hasRemoteModels && (
                  <ActionIcon
                    icon={CircleX}
                    loading={clearRemoteModelsLoading}
                    onClick={async () => {
                      setClearRemoteModelsLoading(true);
                      await clearObtainedModels(provider);
                      setClearRemoteModelsLoading(false);
                    }}
                    size={'small'}
                    title={t('llm.fetcher.clear')}
                  />
                )}
              </div>
            </Typography.Text>
          )}
        </Flexbox>
        {isLoading ? (
          <Skeleton.Button active size={'small'} style={{ width: 120 }} />
        ) : (
          <Flexbox gap={8} horizontal>
            {totalModels >= 30 && (
              <Input
                onChange={(e) => {
                  useAiInfraStore.setState({ modelSearchKeyword: e.target.value });
                }}
                placeholder={'搜索模型...'}
                prefix={<Icon icon={SearchIcon} />}
                size={'small'}
                value={searchKeyword}
              />
            )}
            <Space.Compact>
              <Button
                icon={<Icon icon={LucideRefreshCcwDot} />}
                loading={fetchRemoteModelsLoading}
                onClick={async () => {
                  setFetchRemoteModelsLoading(true);
                  await fetchRemoteModelList(provider);
                  setFetchRemoteModelsLoading(false);
                }}
                size={'small'}
              >
                {fetchRemoteModelsLoading ? t('llm.fetcher.fetching') : t('llm.fetcher.fetch')}
              </Button>
              <Button
                icon={<Icon icon={PlusIcon} />}
                onClick={() => {
                  setShowModal(true);
                }}
                size={'small'}
              />
              <CreateNewModelModal open={showModal} setOpen={setShowModal} />
            </Space.Compact>
          </Flexbox>
        )}{' '}
      </Flexbox>
    </Flexbox>
  );
});
export default ModelTitle;
