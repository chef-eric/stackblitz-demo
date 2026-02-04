/**
 * Minimal reproduction for Privy "User already authenticated" bug
 * 
 * @privy-io/react-auth version: see package.json
 * 
 * STEPS TO REPRODUCE:
 * 1. Connect wallet A (via Privy modal)
 * 2. Login with SIWE - signs and authenticates with wallet A
 * 3. Switch to wallet B in MetaMask (external account change)
 * 4. App detects the wallet change and automatically:
 *    a. Calls logout()
 *    b. Attempts loginWithSiwe() with wallet B
 * 
 * EXPECTED: loginWithSiwe should succeed with wallet B, and linked embedded wallet should be available
 * ACTUAL: Throws "User already authenticated" even after logout(), cannot get linked embedded wallet with B
 */

import { useEffect, useRef, useState } from 'react';

import {
  useLoginWithSiwe,
  usePrivy,
  useWallets,
} from '@privy-io/react-auth';

export default function App() {
  const [logs, setLogs] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isProcessingAccountChange, setIsProcessingAccountChange] = useState(false)

  // Privy hooks
  const { authenticated, ready, user, logout, login } = usePrivy()
  const { generateSiweMessage, loginWithSiwe } = useLoginWithSiwe()
  const { wallets } = useWallets()

  const connectedWallet = wallets[0]
  const address = connectedWallet?.address

  // Track previous address for detecting account changes
  const prevAddressRef = useRef<string | undefined>(undefined)
  const hasCompletedSiweRef = useRef(false)

  const log = (msg: string) => {
    const time = new Date().toISOString().split('T')[1].split('.')[0]
    setLogs(prev => [...prev, `[${time}] ${msg}`])
    console.log(`[${time}] ${msg}`)
  }

  const clearLogs = () => { setLogs([]); setError(null) }

  // Perform SIWE login with the current wallet
  const performSiweLogin = async () => {
    if (!address || !connectedWallet) {
      log('Cannot perform SIWE: no wallet connected')
      return
    }

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
    hasCompletedSiweRef.current = true
  }

  // Detect wallet account change and handle logout + re-SIWE
  useEffect(() => {
    const handleAccountChange = async () => {
      // Skip if not ready or no address
      if (!ready || !address) return

      // Skip if this is the initial address set
      if (prevAddressRef.current === undefined) {
        prevAddressRef.current = address
        return
      }

      // Skip if address hasn't changed
      if (prevAddressRef.current === address) return

      // Skip if we haven't completed SIWE yet (nothing to re-auth)
      if (!hasCompletedSiweRef.current) {
        prevAddressRef.current = address
        return
      }

      // Skip if already processing
      if (isProcessingAccountChange) return

      const oldAddress = prevAddressRef.current
      prevAddressRef.current = address

      log('--- WALLET ACCOUNT CHANGE DETECTED ---')
      log(`Previous: ${oldAddress}`)
      log(`New: ${address}`)

      setIsProcessingAccountChange(true)
      setError(null)

      try {
        // Step 1: Logout
        log('Step 1: Calling logout()...')
        await logout()
        log('logout() completed')

        // Small delay to ensure state is updated
        await new Promise(resolve => setTimeout(resolve, 100))

        // Step 2: Attempt SIWE with new wallet
        log('Step 2: Attempting SIWE with new wallet...')
        await performSiweLogin()

      } catch (e: any) {
        log(`❌ FAILED: ${e.message}`)
        setError(e.message)
        log('NOTE: Cannot get linked embedded wallet with wallet B')
      } finally {
        setIsProcessingAccountChange(false)
      }
    }

    handleAccountChange()
  }, [address, ready])

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

  // 2. Login with SIWE (manual trigger)
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

      await performSiweLogin()
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
          <li>Connect wallet A (have multiple accounts in MetaMask)</li>
          <li>Login with SIWE (authenticate with wallet A)</li>
          <li><b>Switch to wallet B in MetaMask</b></li>
          <li>App auto-detects account change:
            <ul style={{ marginTop: 5 }}>
              <li>Calls logout()</li>
              <li>Attempts loginWithSiwe() with wallet B</li>
            </ul>
          </li>
          <li style={{ color: 'red' }}><b>BUG: "User already authenticated" error</b></li>
          <li style={{ color: 'red' }}><b>Cannot get linked embedded wallet with wallet B</b></li>
        </ol>
      </div>

      {/* Processing indicator */}
      {isProcessingAccountChange && (
        <div style={{ background: '#fff3e0', border: '1px solid #ffcc80', padding: 15, borderRadius: 8, marginBottom: 20 }}>
          <b style={{ color: '#e65100' }}>Processing wallet account change...</b>
        </div>
      )}

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
