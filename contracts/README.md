# EduChain - Blockchain-based Academic Credential Verification

EduChain is a decentralized platform for issuing and verifying academic credentials using blockchain technology.

## Features

- Institution registration and management
- Digital credential issuance
- Credential verification
- Student credential management
- Expiry and revocation system

## Prerequisites

- Node.js (v14 or later)
- npm or yarn
- MetaMask or any Web3 wallet
- Hardhat

## Installation

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

## Local Development

1. Start the local Hardhat network:
```bash
npx hardhat node
```

2. In a new terminal, deploy the contract:
```bash
npx hardhat run scripts/deploy.ts --network localhost
```

3. Connect MetaMask to the local network:
   - Network Name: Localhost
   - RPC URL: http://127.0.0.1:8545
   - Chain ID: 1337
   - Currency Symbol: ETH

## Smart Contract Functions

### For Institutions
- `registerInstitution(string name, string location)`: Register a new institution
- `issueCredential(address student, string studentName, string courseName, uint256 expiryDate)`: Issue a new credential
- `revokeCredential(string credentialId)`: Revoke an issued credential

### For Students
- `getStudentCredentials(address student)`: View all credentials for a student
- `verifyCredential(string credentialId)`: Verify a credential's validity

## Testing

Run the test suite:
```bash
npx hardhat test
```

## License

MIT
