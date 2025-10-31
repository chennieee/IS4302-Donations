import { useAccount, useChainId, useSwitchChain } from 'wagmi'

// Local hardhat chain
const CHAIN_ID = Number(import.meta.env.VITE_CHAIN_ID ?? 1337)
const localhostChain = {
    id: CHAIN_ID,
    name: 'Hardhat Local'
}

export default function ConnectWalletButton({ className = '' }) {
    const { address, isConnected } = useAccount()
    const chainId = useChainId()
    const { switchChainAsync } = useSwitchChain()

    async function onClick() {
        // Check if wallet modal exists
        if (!window.web3modal) {
            console.error('Web3Modal not initialised')
            return
        }

        // If not connected, open wallet modal
        if (!isConnected) {
            await window.web3modal.open()
            return
        }

        // If connected but wrong network, switch to localhost hardhat chain
        if (chainId !== localhostChain.id) {
            await switchChainAsync({ chainId: localhostChain.id })
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