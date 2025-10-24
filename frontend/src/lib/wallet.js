// Initialises Web3Modal (WalletConnect) + Wagmi configuration
// Use this to get the user's wallet address

import { createAppKit } from '@reown/appkit/react'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { WagmiProvider } from 'wagmi'
import { sepolia } from '@reown/appkit/networks'  //testnet (test ETH, no real money)

const projectId = import.meta.env.VITE_WC_PROJECT_ID
const appUrl = import.meta.env.VITE_APP_URL
//import appIconUrl from '../assets/react.svg?url'

const metadata = {
    name: 'GoFundThem',
    description: 'Where transparency is key',
    url: appUrl,
    icons: ['/favicon.ico']
}

const wagmiAdapter = new WagmiAdapter({
  networks: [sepolia],
  projectId
})

// Create AppKit (internally handles WalletConnect, injected wallets, etc)
const appKit = createAppKit({
  adapters: [wagmiAdapter],
  networks: [sepolia],
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