import { useAccount, useChainId, useSwitchChain, useWriteContract, usePublicClient } from 'wagmi'
import { useNavigate } from 'react-router-dom'
import { parseEther } from 'viem'
import CampaignABI from '../abi/Campaign.json'
import { api } from '../lib/api'

// Local hardhat chain
const CHAIN_ID = Number(import.meta.env.VITE_CHAIN_ID ?? 31337)
const localhostChain = { id: CHAIN_ID, name: 'Hardhat Local' }

export default function DonateButton({
  campaignAddr,
  amountEth,
  className = '',
  onSuccess,
  onError
}) {
  const { address: donor, isConnected } = useAccount()
  const chainId = useChainId()
  const { switchChainAsync } = useSwitchChain()
  const { writeContractAsync, isPending } = useWriteContract()
  const publicClient = usePublicClient()
  const navigate = useNavigate()

  async function donate() {
    try {
      // Check if wallet modal exists
      if (!window.web3modal) {
        console.error('Web3Modal not initialized')
        return
      }

      // If not connected, open wallet modal
      if (!isConnected) {
        await window.web3modal.open()
        return
      }

      const user = await api.getUser(donor.toLowerCase()).catch(() => null)
      if (!user?.username) {
        alert('Please set up your profile before making a donation.')
        navigate('/profile')
        return
      }

      // If connected but wrong network, switch to local hardhat chain
      if (chainId !== localhostChain.id) {
        await switchChainAsync({ chainId: localhostChain.id })
      }

      // Validate donation amount
      if (!amountEth || isNaN(amountEth) || Number(amountEth) <= 0) {
        alert('Please enter a valid donation amount')
        return
      }

      // Validate campaign contract address
      if (!/^0x[a-fA-F0-9]{40}$/.test(campaignAddr)) {
        alert('Invalid campaign address')
        return
      }

      // Send transaction: Call donate() on Campaign contract
      console.log('Sending donation transaction:', {
        campaignAddr,
        amountEth,
        value: parseEther(amountEth).toString()
      })

      const wei = parseEther(amountEth)
      const hash = await writeContractAsync({
        abi: CampaignABI,
        address: campaignAddr,
        functionName: 'donate',
        value: wei
      })

      console.log('Donation transaction sent. Hash:', hash)

      // Wait for confirmation
      const receipt = await publicClient.waitForTransactionReceipt({ hash })

      // The indexer will automatically pick up the donation
      // But we can optionally record it for immediate feedback
      if (api.recordDonation) {
        const logIndex = receipt.logs?.[0]?.logIndex ?? 0
        await api.recordDonation(campaignAddr, {
          txHash: hash,
          logIndex,
          donor,
          amount: wei.toString(),
          blockNumber: Number(receipt.blockNumber),
          chainId: localhostChain.id,
          finalized: true
        }).catch(err => console.warn('Backend recording failed:', err))
      }

      if (onSuccess) onSuccess()
      alert("Thank you for your kind donation!")

    } catch (err) {
      console.error('Donation failed:', err)
      if (onError) {
        onError(err)
      } else {
        alert('Transaction failed or was rejected.')
      }
    }
  }

  return (
    <button
      type="button"
      className={className || 'btn btn-primary'}
      onClick={donate}
      disabled={isPending}
    >
      {isPending ? 'Donating…' : 'Donate'}
    </button>
  )
}
