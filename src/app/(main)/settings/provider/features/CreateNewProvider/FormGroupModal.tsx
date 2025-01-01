import { FormModal, Icon } from '@lobehub/ui';
import type { FormItemProps } from '@lobehub/ui/es/Form/components/FormItem';
import { App, Input, Radio } from 'antd';
import { css, cx } from 'antd-style';
import { BrainIcon } from 'lucide-react';
import { memo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Flexbox } from 'react-layout-kit';

import {
  KeyVaultsConfigKey,
  LLMProviderApiTokenKey,
  LLMProviderBaseUrlKey,
} from '@/app/(main)/settings/provider/const';
import { useAiInfraStore } from '@/store/aiInfra/store';
import { CreateAiProviderParams } from '@/types/aiProvider';

const formItem = css`
  display: flex;
  flex-direction: column;
  gap: 12px;

  .ant-form-item {
    margin-block-end: 0;
  }
`;

interface CreateNewProviderProps {
  onClose?: () => void;
  open?: boolean;
}

const CreateNewProvider = memo<CreateNewProviderProps>(({ onClose, open }) => {
  const { t } = useTranslation('modelProvider');
  const [loading, setLoading] = useState(false);
  const createNewAiProvider = useAiInfraStore((s) => s.createNewAiProvider);
  const { message } = App.useApp();
  const onFinish = async (values: CreateAiProviderParams) => {
    setLoading(true);

    try {
      await createNewAiProvider(values);
      setLoading(false);
      message.success(t('createNewAiProvider.createSuccess'));
      onClose?.();
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };

  const basicItems: FormItemProps[] = [
    {
      children: <Input autoFocus placeholder={t('createNewAiProvider.id.placeholder')} />,
      label: t('createNewAiProvider.id.title'),
      minWidth: 400,
      name: 'id',
      rules: [{ message: t('createNewAiProvider.id.required'), required: true }],
    },
    {
      children: <Input placeholder={t('createNewAiProvider.name.placeholder')} />,
      label: t('createNewAiProvider.name.title'),
      minWidth: 400,
      name: 'name',
      rules: [{ message: t('createNewAiProvider.name.required'), required: true }],
    },
    {
      children: (
        <Input.TextArea
          placeholder={t('createNewAiProvider.description.placeholder')}
          style={{ minHeight: 80 }}
        />
      ),
      label: t('createNewAiProvider.description.title'),
      minWidth: 400,
      name: 'description',
    },
    {
      children: <Input allowClear placeholder={'https://logo-url'} />,
      label: t('createNewAiProvider.logo.title'),
      minWidth: 400,
      name: 'logo',
    },
  ];

  const configItems: FormItemProps[] = [
    {
      children: (
        <Radio.Group
          options={[
            { label: 'OpenAI', value: 'openai' },
            { label: 'Anthropic', value: 'anthropic' },
          ]}
        />
      ),
      label: t('createNewAiProvider.sdkType.title'),
      name: 'sdkType',
      rules: [{ message: t('createNewAiProvider.sdkType.required'), required: true }],
    },
    {
      children: (
        <Input.Password
          autoComplete={'new-password'}
          placeholder={t('createNewAiProvider.apiKey.placeholder')}
        />
      ),
      label: t('createNewAiProvider.apiKey.title'),
      minWidth: 400,
      name: [KeyVaultsConfigKey, LLMProviderApiTokenKey],
      rules: [{ message: t('createNewAiProvider.apiKey.required'), required: true }],
    },
    {
      children: <Input allowClear placeholder={'https://xxxx-proxy.com/v1'} />,
      desc: t('createNewAiProvider.proxyUrl.placeholder'),
      label: t('createNewAiProvider.proxyUrl.title'),
      minWidth: 400,
      name: [KeyVaultsConfigKey, LLMProviderBaseUrlKey],
    },
  ];

  return (
    <FormModal
      // className={cx(formItem)}
      items={[
        {
          children: basicItems,
          title: t('createNewAiProvider.basicTitle'),
        },
        {
          children: configItems,
          title: t('createNewAiProvider.configTitle'),
        },
      ]}
      onFinish={onFinish}
      open={open}
      submitLoading={loading}
      submitText={t('createNewAiProvider.confirm')}
      title={
        <Flexbox gap={8} horizontal>
          <Icon icon={BrainIcon} />
          {t('createNewAiProvider.title')}
        </Flexbox>
      }
    />
  );
});

export default CreateNewProvider;
