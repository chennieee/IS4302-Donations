// Initialises Web3Modal (WalletConnect) + Wagmi configuration
// Use this to get the user's wallet address

import { createWeb3Modal } from '@web3modal/wagmi/react'
import { defaultWagmiConfig } from '@web3modal/wagmi'
import { WagmiProvider } from 'wagmi'
import { sepolia } from 'viem/chains'  //testnet (test ETH, no real money)

const projectId = import.meta.env.VITE_WC_PROJECT_ID
const appUrl = import.meta.env.VITE_APP_URL
import appIconUrl from '../assets/react.svg?url'

let modal, wagmiConfig

export function initWallet() {
    if (modal && wagmiConfig) return { modal, wagmiConfig }

    const chains = [sepolia]

    wagmiConfig = defaultWagmiConfig({
        projectId,
        chains,
        metadata: {
            name: 'Donations',
            description: 'Non-custodial donations dApp',
            url: appUrl,
            icons: [appIconUrl]
        }
    })

    modal = createWeb3Modal({
        wagmiConfig, 
        projectId, 
        themeMode: 'light' 
    })

    return { modal, wagmiConfig }
}

export { WagmiProvider }