import { useQuery } from '@tanstack/react-query'

export function useUsername(address) {
  const { data, isLoading } = useQuery({
    queryKey: ['user', address?.toLowerCase()],
    enabled: !!address,
    queryFn: async () => {
      const res = await fetch(`/api/users/${address}`)
      if (!res.ok) throw new Error('not-found')
      return res.json()
    }
  })
  const fallback = address ? `${address.slice(0,6)}…${address.slice(-4)}` : ''
  return { name: data?.username || fallback, user: data, isLoading }
}