import { createAppKit } from '@reown/appkit/react'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { WagmiProvider } from 'wagmi'

const CHAIN_ID = Number(import.meta.env.VITE_CHAIN_ID ?? 1337)
const RPC_URL = import.meta.env.VITE_RPC_URL ?? 'http://127.0.0.1:8545'

// Local Hardhat network
const localhostChain = {
  id: CHAIN_ID,
  name: 'Hardhat Local',
  nativeCurrency: {
    name: 'Ether',
    symbol: 'ETH',
    decimals: 18
  },
  rpcUrls: {
    default: { http: [RPC_URL] },
    public: { http: [RPC_URL] }
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