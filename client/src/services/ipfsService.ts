// Interface for transaction data
export interface TransactionData {
  address: string;
  role: 'institution' | 'student';
  timestamp: number;
  transactionHash: string;
  paymentConfirmed: boolean;
  ipfsHash?: string;
  status?: 'pending' | 'approved' | 'rejected';
}

// Pinata API Credentials
const PINATA_API_KEY = import.meta.env.VITE_PINATA_API_KEY || '';
const PINATA_SECRET_KEY = import.meta.env.VITE_PINATA_SECRET_KEY || '';
const PINATA_JWT = import.meta.env.VITE_PINATA_JWT || '';

/**
 * Check if Pinata configuration is valid
 * @returns boolean indicating if Pinata is configured
 */
export const isPinataConfigured = (): boolean => {
  return Boolean(PINATA_JWT) || (Boolean(PINATA_API_KEY) && Boolean(PINATA_SECRET_KEY));
};

/**
 * Store transaction data on IPFS using Pinata
 * @param data Transaction data to store
 * @returns IPFS hash of the stored data
 */
export const storeTransactionData = async (data: TransactionData): Promise<string> => {
  try {
    console.log('Storing transaction data on IPFS:', data);
    
    if (!isPinataConfigured()) {
      console.warn('Pinata API keys not configured. Falling back to localStorage.');
      throw new Error('Pinata API keys not configured');
    }
    
    // API call to pin JSON to IPFS
    const response = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${PINATA_JWT}`,
        'pinata_api_key': PINATA_API_KEY,
        'pinata_secret_api_key': PINATA_SECRET_KEY
      },
      body: JSON.stringify({
        pinataContent: data,
        pinataMetadata: {
          name: `EduChain_${data.role}_${Date.now()}`,
          keyvalues: {
            address: data.address.toLowerCase(),
            role: data.role,
            timestamp: data.timestamp.toString(),
            transactionHash: data.transactionHash
          }
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Pinata API error:', errorText);
      throw new Error(`Error pinning to IPFS: ${response.statusText}`);
    }

    const result = await response.json();
    console.log('Transaction data stored on IPFS:', result);
    
    // Store IPFS hash in local storage for easy access
    storeTxHashMapping(data.address, data.transactionHash, result.IpfsHash);
    
    return result.IpfsHash;
  } catch (error) {
    console.error('Error storing transaction data on IPFS:', error);
    // Fall back to localStorage if Pinata fails
    storeDataInLocalStorage(data);
    throw error;
  }
};

/**
 * Retrieve transaction data from IPFS via Pinata gateway
 * @param ipfsHash IPFS hash of the stored data
 * @returns Transaction data
 */
export const retrieveTransactionData = async (ipfsHash: string): Promise<TransactionData | null> => {
  try {
    // Get data from IPFS gateway
    const response = await fetch(`https://gateway.pinata.cloud/ipfs/${ipfsHash}`);
    if (!response.ok) {
      throw new Error(`Failed to retrieve data: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data as TransactionData;
  } catch (error) {
    console.error('Error retrieving transaction data from IPFS:', error);
    return null;
  }
};

/**
 * Store transaction data in localStorage as fallback
 * @param data Transaction data to store
 */
export const storeDataInLocalStorage = (data: TransactionData): void => {
  console.log('Falling back to localStorage for transaction data:', data);
  
  try {
    // Get existing data
    let pendingUsers: TransactionData[] = [];
    const pendingData = window.localStorage.getItem('pendingUsers');
    if (pendingData) {
      pendingUsers = JSON.parse(pendingData);
    }
    
    // Check if this address already exists
    const existingIndex = pendingUsers.findIndex(
      (user: TransactionData) => user.address.toLowerCase() === data.address.toLowerCase()
    );
    
    if (existingIndex !== -1) {
      // Update existing record
      pendingUsers[existingIndex] = data;
    } else {
      // Add new record
      pendingUsers.push(data);
    }
    
    // Store back to localStorage
    window.localStorage.setItem('pendingUsers', JSON.stringify(pendingUsers));
    console.log('Transaction data stored in localStorage:', pendingUsers);
  } catch (error) {
    console.error('Error storing transaction data in localStorage:', error);
  }
};

/**
 * Store a mapping between Ethereum transaction hash and IPFS hash
 */
export const storeTxHashMapping = (address: string, txHash: string, ipfsHash: string): void => {
  try {
    // Get existing mappings
    const mappingsKey = 'txToIpfsMappings';
    let mappings: Record<string, string> = {};
    
    const storedMappings = window.localStorage.getItem(mappingsKey);
    if (storedMappings) {
      mappings = JSON.parse(storedMappings);
    }
    
    // Add new mapping
    mappings[txHash] = ipfsHash;
    
    // Also store by address for easy lookup
    const addressMappingsKey = `ipfsMappings_${address.toLowerCase()}`;
    let addressMappings: string[] = [];
    
    const storedAddressMappings = window.localStorage.getItem(addressMappingsKey);
    if (storedAddressMappings) {
      addressMappings = JSON.parse(storedAddressMappings);
    }
    
    if (!addressMappings.includes(ipfsHash)) {
      addressMappings.push(ipfsHash);
    }
    
    // Store mappings
    window.localStorage.setItem(mappingsKey, JSON.stringify(mappings));
    window.localStorage.setItem(addressMappingsKey, JSON.stringify(addressMappings));
    
    console.log('Transaction hash mapping stored:', { txHash, ipfsHash });
  } catch (error) {
    console.error('Error storing transaction hash mapping:', error);
  }
};

/**
 * Get IPFS hash for a transaction hash
 */
export const getIpfsHashForTx = (txHash: string): string | null => {
  try {
    const mappingsKey = 'txToIpfsMappings';
    const storedMappings = window.localStorage.getItem(mappingsKey);
    
    if (storedMappings) {
      const mappings = JSON.parse(storedMappings);
      return mappings[txHash] || null;
    }
    
    return null;
  } catch (error) {
    console.error('Error getting IPFS hash for transaction:', error);
    return null;
  }
};

/**
 * Get all IPFS hashes for an address
 */
export const getIpfsHashesForAddress = (address: string): string[] => {
  try {
    const addressMappingsKey = `ipfsMappings_${address.toLowerCase()}`;
    const storedMappings = window.localStorage.getItem(addressMappingsKey);
    
    if (storedMappings) {
      return JSON.parse(storedMappings);
    }
    
    return [];
  } catch (error) {
    console.error('Error getting IPFS hashes for address:', error);
    return [];
  }
};

/**
 * Get all transactions for a specific address from Pinata
 * @param address Ethereum address to search for
 * @returns Array of IPFS hashes for the address
 */
export const getTransactionsForAddress = async (address: string): Promise<string[]> => {
  try {
    if (!isPinataConfigured()) {
      console.warn('Pinata API keys not configured. Using localStorage fallback.');
      return getIpfsHashesForAddress(address);
    }
    
    // Call Pinata API to get pins for this address
    const response = await fetch('https://api.pinata.cloud/data/pinList', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${PINATA_JWT}`,
        'pinata_api_key': PINATA_API_KEY,
        'pinata_secret_api_key': PINATA_SECRET_KEY
      }
    });
    
    if (!response.ok) {
      throw new Error(`Error fetching pins: ${response.statusText}`);
    }
    
    const result = await response.json();
    // Filter pins by metadata that has the matching address
    const addressPins = result.rows.filter((pin: any) => {
      return pin.metadata?.keyvalues?.address?.toLowerCase() === address.toLowerCase();
    });
    
    return addressPins.map((pin: any) => pin.ipfs_pin_hash);
  } catch (error) {
    console.error('Error getting transactions for address from IPFS:', error);
    // Fall back to localStorage
    return getIpfsHashesForAddress(address);
  }
};

/**
 * Verify if a transaction exists on the blockchain
 * @param txHash Transaction hash to verify
 * @returns Boolean indicating if transaction exists
 */
export const verifyTransaction = async (txHash: string): Promise<boolean> => {
  try {
    if (!window.ethereum) {
      throw new Error('MetaMask not available');
    }
    
    const tx = await window.ethereum.request({
      method: 'eth_getTransactionByHash',
      params: [txHash],
    });
    
    return tx !== null;
  } catch (error) {
    console.error('Error verifying transaction:', error);
    return false;
  }
};

export default {
  storeTransactionData,
  retrieveTransactionData,
  getIpfsHashForTx,
  getIpfsHashesForAddress,
  getTransactionsForAddress,
  verifyTransaction,
  isPinataConfigured,
}; 