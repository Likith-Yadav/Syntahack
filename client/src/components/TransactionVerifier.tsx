import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useLocation, useNavigate } from "react-router-dom";
import { verifyTransaction, retrieveTransactionData, getIpfsHashForTx } from "../services/ipfsService";

interface TransactionVerifierProps {
  initialTxHash?: string;
}

export default function TransactionVerifier({ initialTxHash = "" }: TransactionVerifierProps) {
  const [txHash, setTxHash] = useState(initialTxHash);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<{
    verified: boolean;
    onChain: boolean;
    ipfsHash?: string;
    ipfsData?: any;
    error?: string;
  } | null>(null);
  
  const location = useLocation();
  const navigate = useNavigate();
  
  // Parse txHash from URL query parameter
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const hashFromUrl = params.get('txHash');
    
    if (hashFromUrl) {
      setTxHash(hashFromUrl);
      // Automatically verify when hash is provided in URL
      handleVerify(hashFromUrl);
    }
  }, [location]);

  const handleVerify = async (hashToVerify: string = txHash) => {
    if (!hashToVerify) return;

    setIsVerifying(true);
    setVerificationResult(null);

    try {
      // Step 1: Check if transaction exists on the blockchain
      const onChainResult = await verifyTransaction(hashToVerify);
      
      // Step 2: Check if we have IPFS data for this transaction
      const ipfsHash = getIpfsHashForTx(hashToVerify);
      
      // Step 3: If we have an IPFS hash, retrieve the data
      let ipfsData = null;
      if (ipfsHash) {
        ipfsData = await retrieveTransactionData(ipfsHash);
      }
      
      // Set result
      setVerificationResult({
        verified: Boolean(onChainResult && ipfsHash && ipfsData),
        onChain: onChainResult,
        ipfsHash: ipfsHash || undefined,
        ipfsData: ipfsData || undefined
      });
    } catch (error) {
      console.error("Error verifying transaction:", error);
      setVerificationResult({
        verified: false,
        onChain: false,
        error: error instanceof Error ? error.message : "Unknown error"
      });
    } finally {
      setIsVerifying(false);
    }
  };

  // Update URL with txHash for shareable links
  const updateUrl = () => {
    if (txHash) {
      navigate(`/verify-transaction?txHash=${txHash}`, { replace: true });
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-start pt-24 bg-gradient-to-br from-purple-900/20 to-black/20">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-black/40 p-8 rounded-2xl border border-purple-500/20 w-full max-w-2xl mx-auto"
      >
        <h2 className="text-2xl font-semibold mb-6 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
          Verify Transaction
        </h2>
        
        <div className="space-y-6">
          <div>
            <label className="block text-gray-300 mb-2 font-medium">Transaction Hash</label>
            <div className="flex space-x-4">
              <input
                type="text"
                value={txHash}
                onChange={(e) => setTxHash(e.target.value)}
                placeholder="0x..."
                className="flex-1 bg-black/50 border-2 border-purple-500/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500/40 transition-all duration-300"
              />
              <button
                onClick={() => {
                  handleVerify();
                  updateUrl();
                }}
                disabled={!txHash || isVerifying}
                className={`px-6 py-2 rounded-xl transition-all duration-300 ${
                  !txHash || isVerifying
                    ? "bg-gray-500/10 border-2 border-gray-500/20 text-gray-400 cursor-not-allowed"
                    : "bg-purple-500/10 border-2 border-purple-500/20 hover:bg-purple-500/20 text-purple-400 hover:text-purple-300"
                }`}
              >
                {isVerifying ? (
                  <div className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-purple-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Verifying
                  </div>
                ) : "Verify"}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Enter a transaction hash to verify its authenticity on the blockchain and IPFS
            </p>
          </div>
          
          {verificationResult && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className={`mt-6 p-6 rounded-xl ${
                verificationResult.verified
                  ? "bg-green-500/10 border-2 border-green-500/20"
                  : "bg-red-500/10 border-2 border-red-500/20"
              }`}
            >
              <h3 className={`text-xl font-semibold mb-4 ${
                verificationResult.verified
                  ? "text-green-400"
                  : "text-red-400"
              }`}>
                {verificationResult.verified
                  ? "Verification Successful"
                  : "Verification Failed"
                }
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-center">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-3 ${
                    verificationResult.onChain
                      ? "bg-green-500/20 text-green-400"
                      : "bg-red-500/20 text-red-400"
                  }`}>
                    {verificationResult.onChain ? "✓" : "✗"}
                  </div>
                  <span className="text-gray-300">
                    {verificationResult.onChain
                      ? "Transaction found on blockchain"
                      : "Transaction not found on blockchain"
                    }
                  </span>
                </div>
                
                <div className="flex items-center">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-3 ${
                    verificationResult.ipfsHash
                      ? "bg-green-500/20 text-green-400"
                      : "bg-red-500/20 text-red-400"
                  }`}>
                    {verificationResult.ipfsHash ? "✓" : "✗"}
                  </div>
                  <span className="text-gray-300">
                    {verificationResult.ipfsHash
                      ? "IPFS record found"
                      : "IPFS record not found"
                    }
                  </span>
                </div>
                
                {verificationResult.ipfsHash && (
                  <div className="mt-6 bg-black/30 p-4 rounded-lg">
                    <p className="text-gray-400 text-sm mb-1">IPFS Hash:</p>
                    <p className="text-blue-400 text-sm break-all">{verificationResult.ipfsHash}</p>
                    <a 
                      href={`https://gateway.pinata.cloud/ipfs/${verificationResult.ipfsHash}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-xs text-purple-400 hover:text-purple-300 mt-1 block"
                    >
                      View on IPFS Gateway
                    </a>
                  </div>
                )}
                
                {verificationResult.ipfsData && (
                  <div className="mt-4">
                    <p className="text-gray-400 text-sm mb-1">Transaction Data:</p>
                    <pre className="bg-black/30 p-4 rounded-lg text-xs text-gray-300 overflow-auto max-h-48">
                      {JSON.stringify(verificationResult.ipfsData, null, 2)}
                    </pre>
                  </div>
                )}
                
                {verificationResult.error && (
                  <div className="mt-4 bg-red-500/10 p-4 rounded-lg">
                    <p className="text-red-400 text-sm">{verificationResult.error}</p>
                  </div>
                )}
                
                {/* Share button for successful verification */}
                {verificationResult.verified && (
                  <div className="mt-6">
                    <button
                      onClick={() => {
                        // Copy verification URL to clipboard
                        navigator.clipboard.writeText(window.location.href);
                        alert("Verification link copied to clipboard!");
                      }}
                      className="w-full py-3 rounded-xl bg-purple-500/10 border-2 border-purple-500/20 hover:bg-purple-500/20 transition-all duration-300 text-purple-400 hover:text-purple-300"
                    >
                      Share Verification Link
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
      
      {/* Return to home link */}
      <a
        href="/"
        className="mt-8 text-gray-400 hover:text-purple-400 transition-colors"
      >
        Return to Home
      </a>
    </div>
  );
} 