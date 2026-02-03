import React from 'react';

import ReactDOM from 'react-dom/client';
import {
  createConfig,
  http,
  WagmiProvider,
} from 'wagmi';
import { bsc } from 'wagmi/chains';

import { PrivyProvider } from '@privy-io/react-auth';
import {
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query';

import App from './App';

// TODO: Replace with your Privy App ID
const PRIVY_APP_ID = 'YOUR_PRIVY_APP_ID'

const queryClient = new QueryClient()

const wagmiConfig = createConfig({
  chains: [bsc],
  transports: {
    [bsc.id]: http(),
  },
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <PrivyProvider
        appId={PRIVY_APP_ID}
        config={{
          loginMethods: ['wallet'],
          appearance: {
            theme: 'light',
          },
          embeddedWallets: {
            createOnLogin: 'off',
          },
        }}
      >
        <WagmiProvider config={wagmiConfig}>
          <App />
        </WagmiProvider>
      </PrivyProvider>
    </QueryClientProvider>
  </React.StrictMode>
)
