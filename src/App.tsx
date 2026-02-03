/**
 * Minimal reproduction for Privy "User already authenticated" bug
 * 
 * @privy-io/react-auth version: see package.json
 * 
 * STEPS TO REPRODUCE:
 * 1. Click "Connect with Privy" to connect wallet
 * 2. Click "Login with SIWE" - signs and authenticates
 * 3. Switch to a different account in MetaMask  
 * 4. Click "Logout from Privy"
 * 5. Click "Login with SIWE" again
 * 
 * EXPECTED: loginWithSiwe should succeed with new account
 * ACTUAL: Throws "User already authenticated" even after logout()
 */

import { useState } from 'react';

import {
  useLoginWithSiwe,
  usePrivy,
  useWallets,
} from '@privy-io/react-auth';

export default function App() {
  const [logs, setLogs] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)

  // Privy hooks
  const { authenticated, ready, user, logout, login } = usePrivy()
  const { generateSiweMessage, loginWithSiwe } = useLoginWithSiwe()
  const { wallets } = useWallets()

  const connectedWallet = wallets[0]
  const address = connectedWallet?.address

  const log = (msg: string) => {
    const time = new Date().toISOString().split('T')[1].split('.')[0]
    setLogs(prev => [...prev, `[${time}] ${msg}`])
    console.log(`[${time}] ${msg}`)
  }

  const clearLogs = () => { setLogs([]); setError(null) }

  // 1. Connect wallet via Privy modal
  const handleConnect = async () => {
    try {
      clearLogs()
      log('Opening Privy connect modal...')
      login()
    } catch (e: any) {
      log(`Connect failed: ${e.message}`)
      setError(e.message)
    }
  }

  // 2. Login with SIWE
  const handleLoginSiwe = async () => {
    try {
      setError(null)
      log('--- Starting SIWE Login ---')
      log(`Address: ${address}`)
      log(`Privy ready: ${ready}`)
      log(`Privy authenticated: ${authenticated}`)
      log(`Wallets count: ${wallets.length}`)

      if (!address) throw new Error('No address - connect wallet first')
      if (!connectedWallet) throw new Error('No wallet connected')

      log('Generating SIWE message...')
      const message = await generateSiweMessage({
        address,
        chainId: 'eip155:56',
      })
      log('Message generated')

      log('Requesting signature...')
      const provider = await connectedWallet.getEthereumProvider()
      const signature = await provider.request({
        method: 'personal_sign',
        params: [message, address],
      })
      log('Signature obtained')

      log('Calling loginWithSiwe()...')
      await loginWithSiwe({ message, signature: signature as string })
      log('✅ SUCCESS: loginWithSiwe completed!')
    } catch (e: any) {
      log(`❌ FAILED: ${e.message}`)
      setError(e.message)
    }
  }

  // 3. Logout from Privy
  const handleLogout = async () => {
    try {
      setError(null)
      log('--- Logging out from Privy ---')
      log(`Before: authenticated = ${authenticated}`)
      await logout()
      log('logout() completed')
      // Check after a delay
      setTimeout(() => log(`After 500ms: authenticated = ${authenticated}`), 500)
    } catch (e: any) {
      log(`Logout failed: ${e.message}`)
      setError(e.message)
    }
  }

  const linkedWallets = user?.linkedAccounts
    ?.filter(a => a.type === 'wallet' && 'address' in a)
    .map(a => (a as any).address) ?? []

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: 20 }}>
      <h1 style={{ marginBottom: 10 }}>
        Privy "User already authenticated" Bug
      </h1>
      <p style={{ color: '#666', marginBottom: 20 }}>
        See <code>package.json</code> for versions
      </p>

      {/* Current State */}
      <div style={{ background: '#fff', padding: 15, borderRadius: 8, marginBottom: 20, border: '1px solid #ddd' }}>
        <h3 style={{ margin: '0 0 10px 0' }}>Current State</h3>
        <div style={{ fontFamily: 'monospace', fontSize: 13, lineHeight: 1.6 }}>
          <div>privy ready: <b>{String(ready)}</b></div>
          <div>privy authenticated: <b style={{ color: authenticated ? 'green' : 'red' }}>{String(authenticated)}</b></div>
          <div>privy wallets: <b>{wallets.length}</b></div>
          <div>current address: <b>{address ?? 'none'}</b></div>
          <div>linked wallets: <b>{linkedWallets.join(', ') || 'none'}</b></div>
        </div>
      </div>

      {/* Steps */}
      <div style={{ background: '#e3f2fd', padding: 15, borderRadius: 8, marginBottom: 20 }}>
        <h3 style={{ margin: '0 0 10px 0' }}>Steps to Reproduce</h3>
        <ol style={{ margin: 0, paddingLeft: 20, lineHeight: 1.8 }}>
          <li>Connect wallet (have multiple accounts in MetaMask)</li>
          <li>Login with SIWE</li>
          <li><b>Switch to different account in MetaMask</b></li>
          <li>Logout from Privy</li>
          <li>Login with SIWE again</li>
          <li style={{ color: 'red' }}><b>BUG: "User already authenticated" error</b></li>
        </ol>
      </div>

      {/* Buttons */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 20 }}>
        <button onClick={handleConnect} style={btnStyle('#2196f3')}>
          1. Connect with Privy
        </button>
        <button onClick={handleLoginSiwe} style={btnStyle('#4caf50')}>
          2. Login SIWE
        </button>
        <button onClick={handleLogout} style={btnStyle('#ff9800')}>
          3. Logout Privy
        </button>
        <button onClick={clearLogs} style={btnStyle('#607d8b')}>
          Clear Logs
        </button>
      </div>

      {/* Error */}
      {error && (
        <div style={{ background: '#ffebee', border: '1px solid #ef9a9a', padding: 15, borderRadius: 8, marginBottom: 20 }}>
          <b style={{ color: '#c62828' }}>Error:</b>
          <pre style={{ margin: '5px 0 0 0', color: '#c62828', whiteSpace: 'pre-wrap' }}>{error}</pre>
        </div>
      )}

      {/* Logs */}
      <div>
        <h3 style={{ margin: '0 0 10px 0' }}>Logs</h3>
        <div style={{ 
          background: '#1e1e1e', 
          color: '#4ec9b0', 
          padding: 15, 
          borderRadius: 8, 
          fontFamily: 'monospace', 
          fontSize: 12,
          maxHeight: 300,
          overflow: 'auto',
          lineHeight: 1.6
        }}>
          {logs.length === 0 ? (
            <span style={{ color: '#666' }}>Click buttons to see logs...</span>
          ) : (
            logs.map((l, i) => <div key={i}>{l}</div>)
          )}
        </div>
      </div>
    </div>
  )
}

const btnStyle = (bg: string): React.CSSProperties => ({
  background: bg,
  color: '#fff',
  border: 'none',
  padding: '10px 16px',
  borderRadius: 6,
  cursor: 'pointer',
  fontWeight: 500,
  fontSize: 14,
})
