import { notFound } from 'next/navigation';
import { PropsWithChildren } from 'react';
import { Flexbox } from 'react-layout-kit';

import NProgress from '@/components/NProgress';
import { serverFeatureFlags } from '@/config/featureFlags';
import { MAX_WIDTH } from '@/const/layoutTokens';

import ProviderMenu from './ProviderMenu';

const Layout = ({ children }: PropsWithChildren) => {
  const showLLM = serverFeatureFlags().showProvider;
  if (!showLLM) return notFound();

  return (
    <>
      <NProgress />
      <Flexbox horizontal width={'100%'}>
        <ProviderMenu />
        <Flexbox
          align={'center'}
          height={'100%'}
          paddingBlock={16}
          style={{ overflowX: 'hidden', overflowY: 'auto' }}
          width={'100%'}
        >
          <Flexbox
            gap={40}
            paddingInline={24}
            style={{
              maxWidth: MAX_WIDTH,
            }}
            width={'100%'}
          >
            {children}
          </Flexbox>
        </Flexbox>
      </Flexbox>
    </>
  );
};
export default Layout;
