import { useAccount, useChainId, useSwitchChain } from 'wagmi'
import { sepolia } from 'viem/chains'

export default function ConnectWalletButton({ className = '' }) {
    const { address, isConnected } = useAccount()
    const chainId = useChainId()
    const { switchChainAsync } = useSwitchChain()

    async function onClick() {
        // Debugging: Check if web3modal was initialised properly
        if (!window.web3modal) {
            console.error('Web3Modal not initialised')
            return
        }

        // If not connected yet, open wallet modal
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