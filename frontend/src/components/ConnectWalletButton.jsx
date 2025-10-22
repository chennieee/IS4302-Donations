import { useEffect } from 'react'
import { useAccount, useChainId, useSwitchChain } from 'wagmi'
import { initWallet } from '../lib/wallet'
import { sepolia } from 'viem/chains'

export default function ConnectWalletButton({ className = '' }) {
    useEffect(() => { initWallet() }, [])
    const { address, isConnected } = useAccount()
    const chainId = useChainId()
    const { switchChainAsync } = useSwitchChain()

    async function onClick() {
        if (!window.web3modal) return
        if (!isConnected) {
            await window.web3modal.open()
            return
        }
        // If connected but wrong network, switch to Sepolia
        if (chainId !== sepolia.id) {
            await switchChainAsync({ chainId: sepolia.id })
        }
    }

    return (
        <button type="button" className={className || 'btn'} onClick={onClick}>
            {isConnected
                ? `${address.slice(0, 6)}…${address.slice(-4)}`
                : 'Connect Wallet'
            }
        </button>
    )
}