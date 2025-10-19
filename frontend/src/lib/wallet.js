// Initialises Web3Modal (WalletConnect) + Wagmi configuration
// Use this to get the user's wallet address

import { createWeb3Modal } from '@web3modal/wagmi/react'
import { defaultWagmiConfig } from '@web3modal/wagmi'
import { mainnet } from 'viem/chains'

const projectId = import.meta.env.VITE_WC_PROJECT_ID
const appUrl = import.meta.env.VITE_APP_URL
import appIconUrl from '../assets/react.svg?url'

let modal, wagmiConfig

export function initWallet() {
    if (modal) return { modal, wagmiConfig }

    const chains = [mainnet]

    wagmiConfig = defaultWagmiConfig({
        projectId,
        chains,
        metadata: {
            name: 'Donations',
            description: 'Wallet-only frontend; backend handles blockchain',
            url: appUrl,
            icons: [appIconUrl]
        }
    })

    modal = createWeb3Modal({ wagmiConfig, projectId, themeMode: 'light' })

    return { modal, wagmiConfig }
}