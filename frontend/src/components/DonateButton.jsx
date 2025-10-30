import { useAccount, useChainId, useSwitchChain, useWriteContract } from 'wagmi'
import { parseEther } from 'viem'
import CampaignABI from '../abi/Campaign.json'

// Local hardhat chain
const CHAIN_ID = import.meta.env.VITE_CHAIN_ID
const localhostChain = {
  id: CHAIN_ID,
  name: 'Hardhat Local'
}

export default function DonateButton({
  campaignAddr,
  amountEth,
  className = '',
  onSuccess,
  onError
}) {
  const { isConnected } = useAccount()
  const chainId = useChainId()
  const { switchChainAsync } = useSwitchChain()
  const { writeContract, isPending } = useWriteContract()

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

      // If connected but wrong network, switch to localhost hardhat chain
      if (chainId !== localhostChain.id) {
        await switchChainAsync({ chainId: localhostChain.id })
      }

      // Validate amount
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
      await writeContract({
          abi: CampaignABI,
          address: campaignAddr,
          functionName: 'donate',
          value: parseEther(amountEth)
      })

      if (onSuccess) onSuccess()
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