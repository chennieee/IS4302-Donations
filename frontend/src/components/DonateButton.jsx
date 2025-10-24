import { useAccount, useChainId, useSwitchChain, useWriteContract } from 'wagmi'
import { sepolia } from 'wagmi/chains'
import { parseEther } from 'viem'
import CampaignABI from '../abi/Campaign.json'

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
      // 1. If web3modal not initialised properly, return console error
      if (!window.web3modal) {
        console.error('Web3Modal not initialized')
        return
      }

      // 2. If wallet not connected yet, open modal
      if (!isConnected) {
        await window.web3modal.open()
        return
      }

      // 3. Make sure we're on Sepolia (11155111)
      if (chainId !== sepolia.id) {
        await switchChainAsync({ chainId: sepolia.id })
      }

      // 4. Validate amount
      if (!amountEth || isNaN(amountEth) || Number(amountEth) <= 0) {
        alert('Please enter a valid donation amount')
        return
      }

      // 5. Validate campaign address
      if (!/^0x[a-fA-F0-9]{40}$/.test(campaignAddr)) {
        alert('Invalid campaign address')
        return
      }

      // 6. Send tx: call donate() payable on the Campaign contract
      await writeContract(
        {
          abi: CampaignABI,
          address: campaignAddr,
          functionName: 'donate',
          value: parseEther(amountEth)
        }
      )

      if (onSuccess) {
        onSuccess()
      }
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