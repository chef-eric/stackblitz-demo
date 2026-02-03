# Privy "User already authenticated" Bug Reproduction

## Bug Summary

`loginWithSiwe()` throws "User already authenticated" error even after calling `logout()`.

## Package Version

- `@privy-io/react-auth`: ^3.13.0

## Steps to Reproduce

1. Connect wallet (MetaMask with multiple accounts)
2. Click "Login with SIWE" - signs and authenticates successfully
3. **Switch to a different account in MetaMask**
4. Click "Logout from Privy"
5. Click "Login with SIWE" again

## Expected Behavior

`loginWithSiwe()` should succeed with the new wallet account.

## Actual Behavior

`loginWithSiwe()` throws: `Error: User already authenticated`

This happens even though:
- `logout()` was called and completed
- The wallet address has changed
- We expect a fresh authentication flow

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

- The bug occurs when switching accounts in MetaMask while authenticated
- Even after `disconnectAsync()` (wagmi) + `logout()` (Privy) + `connectAsync()`, the error persists
- The Privy `authenticated` state may show `false` after logout, but `loginWithSiwe` still fails
