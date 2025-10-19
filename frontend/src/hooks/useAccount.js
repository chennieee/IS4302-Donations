// Hook to get the WalletConnect address from Wagmi (via Web3Modal)
import { useEffect } from 'react'
import { initWallet } from '../lib/wallet'
import { useAccount } from 'wagmi'

export function useAccountWC() {
    useEffect(() => { initWallet() }, [])
    const { address } = useAccount()
    return address || ''
}