'use client';

import { Icon, Tooltip } from '@lobehub/ui';
import { Button } from 'antd';
import { PlusIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { useCreateNewModal } from '../features/CreateNewProvider';

const AddNewProvider = () => {
  const { t } = useTranslation('modelProvider');

  const { open } = useCreateNewModal();

  return (
    <Tooltip title={t('menu.addCustomProvider')}>
      <Button
        color={'default'}
        icon={<Icon icon={PlusIcon} />}
        onClick={() => open()}
        variant={'filled'}
      />
    </Tooltip>
  );
};

export default AddNewProvider;
