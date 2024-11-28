import { Icon } from '@lobehub/ui';
import { BrainIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Flexbox } from 'react-layout-kit';

import { createModal } from '@/components/FunctionModal';

import CreateForm from './CreateForm';

const Title = () => {
  const { t } = useTranslation('modelProvider');
  return (
    <Flexbox gap={8} horizontal>
      <Icon icon={BrainIcon} />
      {t('createNewAiProvider.title')}
    </Flexbox>
  );
};

export const useCreateNewModal = createModal((instance) => {
  return {
    centered: true,
    content: (
      <Flexbox paddingInline={16} style={{ marginBlock: 24 }}>
        <CreateForm
          onClose={() => {
            instance.current?.destroy();
          }}
        />
      </Flexbox>
    ),
    focusTriggerAfterClose: true,
    footer: false,
    styles: {
      content: { width: 800 },
    },
    title: <Title />,
    width: 800,
  };
});
