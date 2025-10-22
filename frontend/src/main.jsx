import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { initWallet, WagmiProvider } from './lib/wallet'
import App from './App.jsx'
import './index.css'

const { wagmiConfig } = initWallet()
const queryClient = new QueryClient()

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <WagmiProvider config={wagmiConfig}>
            <App />
        </WagmiProvider>
      </QueryClientProvider>
    </BrowserRouter>
  </React.StrictMode>
)