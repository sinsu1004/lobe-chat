'use client';

import { ProviderCombine } from '@lobehub/icons';
import { Form, type FormItemProps, Icon, type ItemGroup, Tooltip } from '@lobehub/ui';
import { useDebounceFn } from 'ahooks';
import { Input, Skeleton, Switch } from 'antd';
import { createStyles } from 'antd-style';
import { LockIcon } from 'lucide-react';
import Link from 'next/link';
import { ReactNode, memo, useLayoutEffect } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { Center, Flexbox } from 'react-layout-kit';
import urlJoin from 'url-join';

import InstantSwitch from '@/components/InstantSwitch';
import { FORM_STYLE } from '@/const/layoutTokens';
import { AES_GCM_URL, BASE_PROVIDER_DOC_URL } from '@/const/url';
import { isServerMode } from '@/const/version';
import { aiProviderSelectors, useAiInfraStore } from '@/store/aiInfra';
import { ModelProviderCard } from '@/types/llm';

import { KeyVaultsConfigKey, LLMProviderApiTokenKey, LLMProviderBaseUrlKey } from '../../const';
import Checker from './Checker';
import { SkeletonInput } from './SkeletonInput';

const useStyles = createStyles(({ css, prefixCls, responsive, token }) => ({
  aceGcm: css`
    padding-block: 0 !important;
    .${prefixCls}-form-item-label {
      display: none;
    }
    .${prefixCls}-form-item-control {
      width: 100%;

      font-size: 12px;
      color: ${token.colorTextSecondary};
      text-align: center;

      opacity: 0.66;

      transition: opacity 0.2s ${token.motionEaseInOut};

      &:hover {
        opacity: 1;
      }
    }
  `,
  form: css`
    .${prefixCls}-form-item-control:has(.${prefixCls}-input,.${prefixCls}-select) {
      flex: none;
      width: min(70%, 800px);
      min-width: min(70%, 800px) !important;
    }
    ${responsive.mobile} {
      width: 100%;
      min-width: unset !important;
    }
    .${prefixCls}-select-selection-overflow-item {
      font-size: 12px;
    }
  `,
  help: css`
    font-size: 12px;
    font-weight: 500;
    color: ${token.colorTextDescription};

    background: ${token.colorFillTertiary};
    border-radius: 50%;

    &:hover {
      color: ${token.colorText};
      background: ${token.colorFill};
    }
  `,
  switchLoading: css`
    width: 44px !important;
    min-width: 44px !important;
    height: 22px !important;
    border-radius: 12px !important;
  `,
}));

export interface ProviderConfigProps extends Omit<ModelProviderCard, 'id' | 'chatModels' | 'url'> {
  apiKeyItems?: FormItemProps[];
  canDeactivate?: boolean;
  checkerItem?: FormItemProps;
  className?: string;
  extra?: ReactNode;
  hideSwitch?: boolean;
  id: string;
  modelList?: {
    azureDeployName?: boolean;
    notFoundContent?: ReactNode;
    placeholder?: string;
    showModelFetcher?: boolean;
  };
  showAceGcm?: boolean;
  title?: ReactNode;
}

const ProviderConfig = memo<ProviderConfigProps>(
  ({
    apiKeyItems,
    id,
    proxyUrl,
    showApiKey = true,
    checkModel,
    canDeactivate = true,
    checkerItem,
    title,
    defaultShowBrowserRequest,
    disableBrowserRequest,
    className,
    name,
    showAceGcm = true,
    showChecker = true,
    extra,
  }) => {
    const { t } = useTranslation('setting');
    const [form] = Form.useForm();
    const { cx, styles } = useStyles();

    const [
      toggleProviderEnabled,
      useFetchAiProviderItem,
      updateAiProviderConfig,
      enabled,
      isLoading,
      isFetchOnClient,
      isProviderEndpointNotEmpty,
      isProviderApiKeyNotEmpty,
    ] = useAiInfraStore((s) => [
      s.toggleProviderEnabled,
      s.useFetchAiProviderItem,
      s.updateAiProviderConfig,
      aiProviderSelectors.isProviderEnabled(id)(s),
      aiProviderSelectors.isAiProviderConfigLoading(id)(s),
      aiProviderSelectors.isProviderFetchOnClient(id)(s),
      aiProviderSelectors.isActiveProviderEndpointNotEmpty(s),
      aiProviderSelectors.isActiveProviderApiKeyNotEmpty(s),
    ]);

    const { data } = useFetchAiProviderItem(id);

    useLayoutEffect(() => {
      if (isLoading) return;

      // set the first time
      form.setFieldsValue(data);
    }, [isLoading, id, data]);

    const { run: debouncedUpdate } = useDebounceFn(updateAiProviderConfig, { wait: 500 });

    const apiKeyItem: FormItemProps[] = !showApiKey
      ? []
      : (apiKeyItems ?? [
          {
            children: isLoading ? (
              <SkeletonInput />
            ) : (
              <Input.Password
                autoComplete={'new-password'}
                placeholder={t(`llm.apiKey.placeholder`, { name })}
              />
            ),
            desc: t(`llm.apiKey.desc`, { name }),
            label: t(`llm.apiKey.title`),
            name: [KeyVaultsConfigKey, LLMProviderApiTokenKey],
          },
        ]);

    const aceGcmItem: FormItemProps = {
      children: (
        <>
          <Icon icon={LockIcon} style={{ marginRight: 4 }} />
          <Trans i18nKey="llm.aesGcm" ns={'setting'}>
            您的秘钥与代理地址等将使用
            <Link href={AES_GCM_URL} style={{ marginInline: 4 }} target={'_blank'}>
              AES-GCM
            </Link>
            加密算法进行加密
          </Trans>
        </>
      ),
      className: styles.aceGcm,
      minWidth: undefined,
    };

    const showEndpoint = !!proxyUrl;

    const formItems = [
      ...apiKeyItem,
      showEndpoint && {
        children: isLoading ? (
          <SkeletonInput />
        ) : (
          <Input allowClear placeholder={proxyUrl?.placeholder} />
        ),
        desc: proxyUrl?.desc || t('llm.proxyUrl.desc'),
        label: proxyUrl?.title || t('llm.proxyUrl.title'),
        name: [KeyVaultsConfigKey, LLMProviderBaseUrlKey],
      },
      /*
       * Conditions to show Client Fetch Switch
       * 1. provider is not disabled browser request
       * 2. provider show browser request by default
       * 3. Provider allow to edit endpoint and the value of endpoint is not empty
       * 4. There is an apikey provided by user
       */
      !disableBrowserRequest &&
        (defaultShowBrowserRequest ||
          (showEndpoint && isProviderEndpointNotEmpty) ||
          (showApiKey && isProviderApiKeyNotEmpty)) && {
          children: isLoading ? (
            <Skeleton.Button active className={styles.switchLoading} />
          ) : (
            <Switch disabled={isLoading} value={isFetchOnClient} />
          ),
          desc: t('llm.fetchOnClient.desc'),
          label: t('llm.fetchOnClient.title'),
          minWidth: undefined,
          name: 'fetchOnClient',
        },
      showChecker
        ? (checkerItem ?? {
            children: isLoading ? (
              <Skeleton.Button active />
            ) : (
              <Checker model={checkModel!} provider={id} />
            ),
            desc: t('llm.checker.desc'),
            label: t('llm.checker.title'),
            minWidth: undefined,
          })
        : undefined,
      showAceGcm && isServerMode && aceGcmItem,
    ].filter(Boolean) as FormItemProps[];

    const model: ItemGroup = {
      children: formItems,

      defaultActive: true,

      extra: (
        <Flexbox align={'center'} gap={8} horizontal>
          {extra}
          <Tooltip title={t('llm.helpDoc')}>
            <Link
              href={urlJoin(BASE_PROVIDER_DOC_URL, id)}
              onClick={(e) => e.stopPropagation()}
              target={'_blank'}
            >
              <Center className={styles.help} height={20} width={20}>
                ?
              </Center>
            </Link>
          </Tooltip>
          {canDeactivate ? (
            isLoading ? (
              <Skeleton.Button active className={styles.switchLoading} />
            ) : (
              <InstantSwitch
                enabled={enabled}
                onChange={async (enabled) => {
                  await toggleProviderEnabled(id as any, enabled);
                }}
              />
            )
          ) : undefined}
        </Flexbox>
      ),
      title: (
        <Flexbox
          align={'center'}
          horizontal
          style={{
            height: 24,
            maxHeight: 24,
            ...(enabled ? {} : { filter: 'grayscale(100%)', maxHeight: 24, opacity: 0.66 }),
          }}
        >
          {title ?? <ProviderCombine provider={id} size={24} />}
        </Flexbox>
      ),
    };

    return (
      <Form
        className={cx(styles.form, className)}
        form={form}
        items={[model]}
        onValuesChange={(_, values) => {
          debouncedUpdate(id, values);
        }}
        variant={'pure'}
        {...FORM_STYLE}
      />
    );
  },
);

export default ProviderConfig;

export { SkeletonInput } from './SkeletonInput';
