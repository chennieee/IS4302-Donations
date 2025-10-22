import { parseEther } from 'viem'
import { sepolia } from 'viem/chains'
import { useAccount, useChainId, useSwitchChain, useWriteContract } from 'wagmi'
import { useWeb3Modal } from '@web3modal/wagmi/react'
import CampaignABI from '../abi/Campaign.json'

export default function DonateButton({ campaignAddr, amountEth, className = '', onError, onSuccess }) {
    const { isConnected } = useAccount()
    const chainId = useChainId()
    const { switchChainAsync } = useSwitchChain()
    const { writeContract, isPending } = useWriteContract()
    const { open } = useWeb3Modal()

    const isValidAddr = /^0x[a-fA-F0-9]{40}$/.test(campaignAddr || '')
    const trimmed = (amountEth || '').trim()
    const isValidAmount = /^(\d+(\.\d+)?)$/.test(trimmed) && Number(trimmed) > 0

    async function donate() {
        try {
            if (!isConnected) {
                await open()
                return
            }
            if (!isValidAddr) throw new Error('Invalid campaign address')
            if (!isValidAmount) throw new Error('Enter a valid amount in ETH')

            if (chainId !== sepolia.id) {
                await switchChainAsync({ chainId: sepolia.id })
            }

            const tx = await writeContract({
                address: campaignAddr,
                abi: CampaignABI,
                functionName: 'donate',
                value: parseEther(trimmed)
            })

            onSuccess && onSuccess(tx)
        } catch (e) {
            onError && onError(e?.shortMessage || e?.message || 'Donation failed')
        }
    }

    return (
        <button
        type="button"
        className={className || 'btn'}
        onClick={donate}
        disabled={isPending || !isValidAmount || !isValidAddr}
        title={!isValidAmount ? 'Enter a donation amount' : undefined}
        >
        {isPending ? 'Confirm in wallet…' : (trimmed ? `Donate ${trimmed} ETH` : 'Donate')}
        </button>
    )
}