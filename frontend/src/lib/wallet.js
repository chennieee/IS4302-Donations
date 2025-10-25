import { createAppKit } from '@reown/appkit/react'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { WagmiProvider } from 'wagmi'

// Local Hardhat network
const localhostChain = {
  id: 31337,
  name: 'Hardhat Local',
  nativeCurrency: {
    name: 'Ether',
    symbol: 'ETH',
    decimals: 18
  },
  rpcUrls: {
    default: { http: ['http://127.0.0.1:8545'] },
    public: { http: ['http://127.0.0.1:8545'] }
  }
}

const projectId = import.meta.env.VITE_WC_PROJECT_ID
const appUrl = import.meta.env.VITE_APP_URL

const metadata = {
    name: 'GoFundThem',
    description: 'Where transparency is key',
    url: appUrl,
    icons: ['/favicon.ico']
}

const wagmiAdapter = new WagmiAdapter({
  networks: [localhostChain],
  projectId
})

const appKit = createAppKit({
  adapters: [wagmiAdapter],
  networks: [localhostChain],
  metadata,
  projectId,
  themeMode: 'light'
})

const wagmiConfig = wagmiAdapter.wagmiConfig

export function initWallet() {
  if (!window.web3modal) {
    window.web3modal = {
      async open() {
        appKit.open()
      }
    }
  }
  return { wagmiConfig }
}

export { WagmiProvider }