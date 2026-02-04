# Privy "User already authenticated" Bug Reproduction

## Bug Summary

`loginWithSiwe()` throws "User already authenticated" error even after calling `logout()`.

## Package Version

- `@privy-io/react-auth`: ^3.13.0

## Steps to Reproduce

1. Connect wallet A (MetaMask with multiple accounts)
2. Click "Login with SIWE" - signs and authenticates with wallet A
3. **Switch to wallet B in MetaMask**
4. App automatically detects the account change and:
   - Calls `logout()`
   - Attempts `loginWithSiwe()` with wallet B

## Expected Behavior

- `loginWithSiwe()` should succeed with wallet B
- Linked embedded wallet should be available for wallet B

## Actual Behavior

`loginWithSiwe()` throws: `Error: User already authenticated`

This happens even though:
- `logout()` was called and completed
- The wallet address has changed to wallet B
- We expect a fresh authentication flow

Additionally:
- Cannot get the linked embedded wallet with wallet B

## Setup

1. Replace `YOUR_PRIVY_APP_ID` in `src/main.tsx` with your Privy App ID
2. Run:
   ```bash
   npm install
   npm run dev
   ```

## Online Demo

To run on StackBlitz or CodeSandbox:

1. Go to https://stackblitz.com or https://codesandbox.io
2. Create a new "React (Vite)" project
3. Copy the files from this folder
4. Replace the Privy App ID
5. Run the project

## Additional Notes

- The app automatically detects wallet account changes via `useEffect` watching the address
- When an account change is detected (after SIWE auth), the app:
  1. Calls `logout()` to clear Privy session
  2. Immediately attempts `loginWithSiwe()` with the new wallet
- The bug occurs: even after `logout()` completes, `loginWithSiwe()` throws "User already authenticated"
- The Privy `authenticated` state may show `false` after logout, but `loginWithSiwe` still fails
- The linked embedded wallet cannot be obtained for the new wallet (wallet B)