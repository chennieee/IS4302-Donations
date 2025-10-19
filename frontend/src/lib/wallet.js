// Initialises Web3Modal (WalletConnect) + Wagmi configuration
// Use this to get the user's wallet address

import { createWeb3Modal, defaultWagmiConfig } from '@web3modal/wagmi/react'
import { mainnet } from 'viem/chains'

const projectId = import.meta.env.VITE_WC_PROJECT_ID
const appUrl = import.meta.env.VITE_APP_URL

let modal, wagmiConfig

export function initWallet() {
    if (modal) return { modal, wagmiConfig }

    const chains = [mainnet]

    wagmiConfig = defaultWagmiConfig({
        projectId,
        chains,
        metadata: {
            name: 'Donations App',
            description: 'Wallet-only frontend; backend handles blockchain',
            url: appUrl
        }
    })

    modal = createWeb3Modal({ wagmiConfig, projectId, themeMode: 'light' })

    return { modal, wagmiConfig }
}