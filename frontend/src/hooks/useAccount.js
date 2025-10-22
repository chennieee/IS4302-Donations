// Hook to expose the connected account address
import { useEffect } from 'react'
import { useAccount } from 'wagmi'
import { initWallet } from '../lib/wallet'

export function useAccountWallet() {
    useEffect(() => { initWallet() }, [])
    const { address } = useAccount()
    return address || ''
}