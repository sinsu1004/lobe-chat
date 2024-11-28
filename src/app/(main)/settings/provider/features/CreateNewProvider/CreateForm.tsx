import { Form } from '@lobehub/ui';
import type { FormItemProps } from '@lobehub/ui/es/Form/components/FormItem';
import { App, Button, Input, Radio } from 'antd';
import { css, cx } from 'antd-style';
import { memo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Flexbox } from 'react-layout-kit';

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

interface CreateFormProps {
  onClose?: () => void;
}

const CreateForm = memo<CreateFormProps>(({ onClose }) => {
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

    {
      children: (
        <Radio.Group
          options={[
            { label: 'OpenAI', value: 'openai' },
            { label: 'Anthropic', value: 'anthropic' },
            // { label: 'Ollama', value: 'ollama' },
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
      name: 'apiKey',
      rules: [{ message: t('createNewAiProvider.apiKey.required'), required: true }],
    },
    {
      children: <Input allowClear placeholder={'https://xxxx-proxy.com/v1'} />,
      desc: t('createNewAiProvider.proxyUrl.placeholder'),
      label: t('createNewAiProvider.proxyUrl.title'),
      minWidth: 400,
      name: 'proxyUrl',
    },
  ];

  // const configItems: FormItemProps[] = [
  //   {
  //     children: (
  //       <Radio.Group
  //         options={[
  //           { label: 'OpenAI', value: 'openai' },
  //           { label: 'Anthropic', value: 'anthropic' },
  //           { label: 'Ollama', value: 'ollama' },
  //         ]}
  //       />
  //     ),
  //     label: t('createNewAiProvider.sdkType.title'),
  //     name: 'sdkType',
  //     rules: [{ message: t('createNewAiProvider.sdkType.required'), required: true }],
  //   },
  //   {
  //     children: (
  //       <Input.Password
  //         autoComplete={'new-password'}
  //         placeholder={t('createNewAiProvider.apiKey.placeholder')}
  //       />
  //     ),
  //     label: t('createNewAiProvider.apiKey.title'),
  //     minWidth: 400,
  //     name: 'apiKey',
  //     rules: [{ message: t('createNewAiProvider.apiKey.required'), required: true }],
  //   },
  //   {
  //     children: <Input allowClear placeholder={'https://xxxx-proxy.com/v1'} />,
  //     desc: t('createNewAiProvider.proxyUrl.placeholder'),
  //     label: t('createNewAiProvider.proxyUrl.title'),
  //     minWidth: 400,
  //     name: 'proxyUrl',
  //   },
  // ];

  return (
    <Flexbox gap={8}>
      {/*<div>{t('createNewAiProvider.basicTitle')}</div>*/}
      <Form
        className={cx(formItem)}
        // form={form}
        items={basicItems}
        itemsType={'flat'}
        onFinish={onFinish}
      >
        <Button
          block
          htmlType={'submit'}
          loading={loading}
          style={{ marginTop: 16 }}
          type={'primary'}
        >
          {t('createNewAiProvider.confirm')}
        </Button>
      </Form>
      {/*<div>{t('createNewAiProvider.configTitle')}</div>*/}
      {/*<Form className={cx(formItem)} form={form} items={configItems} itemsType={'flat'} />*/}
    </Flexbox>
  );
});

export default CreateForm;
