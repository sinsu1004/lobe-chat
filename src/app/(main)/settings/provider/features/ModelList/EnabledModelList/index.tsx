import { ActionIcon } from '@lobehub/ui';
import { Typography } from 'antd';
import isEqual from 'fast-deep-equal';
import { ArrowDownUpIcon } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Flexbox } from 'react-layout-kit';

import { useAiInfraStore } from '@/store/aiInfra';
import { aiModelSelectors } from '@/store/aiInfra/selectors';

import ModelItem from '../ModelItem';
import SortModelModal from '../SortModelModal';

const EnabledModelList = () => {
  const { t } = useTranslation('modelProvider');

  const enabledModels = useAiInfraStore(aiModelSelectors.enabledAiProviderModelList, isEqual);
  const [open, setOpen] = useState(false);

  return (
    enabledModels.length > 0 && (
      <>
        <Flexbox horizontal justify={'space-between'}>
          <Typography.Text style={{ fontSize: 12, marginTop: 8 }} type={'secondary'}>
            {t('providerModels.list.enabled')}
          </Typography.Text>
          <ActionIcon
            icon={ArrowDownUpIcon}
            onClick={() => {
              setOpen(true);
            }}
            size={'small'}
            title={t('menu.sort')}
          />
          {open && (
            <SortModelModal
              defaultItems={enabledModels}
              onCancel={() => {
                setOpen(false);
              }}
              open={open}
            />
          )}
        </Flexbox>
        <Flexbox gap={2}>
          {enabledModels.map(({ displayName, id, ...res }) => {
            const label = displayName || id;

            return <ModelItem displayName={label as string} id={id as string} key={id} {...res} />;
          })}
        </Flexbox>
      </>
    )
  );
};
export default EnabledModelList;
