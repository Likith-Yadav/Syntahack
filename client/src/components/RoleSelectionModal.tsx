import { motion } from "framer-motion";
import { BuildingOffice2Icon, UserIcon } from "@heroicons/react/24/outline";
import { useState } from "react";
import { useActiveAccount } from "thirdweb/react";
import { storeTransactionData, isPinataConfigured } from "../services/ipfsService";

// Declare window ethereum for MetaMask
declare global {
  interface Window {
    ethereum: any;
  }
}

interface RoleSelectionModalProps {
  onSelectRole: (role: "institution" | "student") => void;
  onClose: () => void;
}

export default function RoleSelectionModal({ onSelectRole, onClose }: RoleSelectionModalProps) {
  const [selectedRole, setSelectedRole] = useState<"institution" | "student" | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transactionStatus, setTransactionStatus] = useState<"idle" | "processing" | "success" | "error">("idle");
  const [transactionHash, setTransactionHash] = useState<string | null>(null);
  const [ipfsHash, setIpfsHash] = useState<string | null>(null);
  const account = useActiveAccount();

  const handleRoleSelect = (role: "institution" | "student") => {
    setSelectedRole(role);
  };

  const handleConfirmRole = async () => {
    if (!selectedRole || !account?.address) return;
    
    try {
      setIsProcessing(true);
      setTransactionStatus("processing");
      console.log("Starting role confirmation process for:", account.address, "with role:", selectedRole);
      
      // The fee amount in ETH
      const feeAmount = "0.01";
      
      // Request transaction from MetaMask
      const params = {
        from: account.address,
        to: import.meta.env.VITE_ADMIN_ADDRESS || "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65", // Admin address
        value: (parseFloat(feeAmount) * 10**18).toString(16), // Convert ETH to Wei and then to hex
      };
      
      console.log("Requesting transaction with params:", params);
      
      // Request transaction
      const txHash = await window.ethereum.request({
        method: 'eth_sendTransaction',
        params: [params],
      });
      
      // Store transaction hash
      setTransactionHash(txHash);
      console.log("Transaction successful, hash:", txHash);
      
      // Create transaction data object with normalized address
      const transactionData: {
        address: string;
        role: "institution" | "student";
        timestamp: number;
        transactionHash: string;
        paymentConfirmed: boolean;
        status: 'approved'; // Directly mark as approved
        ipfsHash?: string;
      } = {
        address: account.address.toLowerCase(), // Ensure address is normalized
        role: selectedRole,
        timestamp: Date.now(),
        transactionHash: txHash,
        paymentConfirmed: true, // Mark payment as confirmed
        status: 'approved' // Directly approve
      };
      
      console.log("Created transaction data:", transactionData);
      
      // Store on IPFS via Pinata and also in localStorage
      let ipfsHash = "";
      try {
        // Try to store on IPFS
        if (isPinataConfigured()) {
          ipfsHash = await storeTransactionData(transactionData);
          setIpfsHash(ipfsHash);
          console.log("Stored on IPFS with hash:", ipfsHash);
          
          // Add IPFS hash to the transaction data
          transactionData.ipfsHash = ipfsHash;
        } else {
          console.warn("Pinata not configured, storing in localStorage only");
        }
      } catch (ipfsError) {
        console.error("Failed to store on IPFS, but transaction successful:", ipfsError);
        // We continue even if IPFS storage fails as we have localStorage fallback
      }
      
      // Store the approved user in localStorage
      try {
        // Save user as approved
        const approvedData = window.localStorage.getItem("approvedUsers");
        let approvedUsers = approvedData ? JSON.parse(approvedData) : [];
        
        // Remove any existing records for this user to avoid duplicates
        const normalizedAddress = account.address.toLowerCase();
        approvedUsers = approvedUsers.filter(
          (user: any) => user.address.toLowerCase() !== normalizedAddress
        );
        
        // Add the new record
        approvedUsers.push(transactionData);
        
        // Store back to localStorage
        window.localStorage.setItem("approvedUsers", JSON.stringify(approvedUsers));
        console.log("Successfully saved to approvedUsers:", approvedUsers);
        
        // Also store role directly for faster access later
        window.localStorage.setItem(`role_${normalizedAddress}`, selectedRole);
        console.log(`Role for ${normalizedAddress} stored directly as ${selectedRole}`);
      } catch (storageError) {
        console.error("Error saving to localStorage:", storageError);
      }
      
      // Transaction submitted successfully
      setTransactionStatus("success");
      
      // Wait a moment before redirecting
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Complete the role selection
      console.log("Calling onSelectRole with role:", selectedRole);
      onSelectRole(selectedRole);
      
      // Navigate to the appropriate dashboard
      if (selectedRole === "institution") {
        window.location.href = "/institution-dashboard";
      } else if (selectedRole === "student") {
        window.location.href = "/student-dashboard";
      }
    } catch (error) {
      console.error("Transaction failed:", error);
      setTransactionStatus("error");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-md"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-black/80 border border-purple-500/20 rounded-2xl p-8 max-w-md w-full mx-4"
      >
        <h2 className="text-2xl font-bold text-white mb-6 text-center">
          {transactionStatus === "processing" ? "Processing Payment" : 
           transactionStatus === "success" ? "Payment Successful" : 
           transactionStatus === "error" ? "Payment Failed" : "Select Your Role"}
        </h2>
        
        {transactionStatus === "idle" && (
          <div className="space-y-4">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleRoleSelect("institution")}
              className={`w-full flex items-center space-x-4 p-4 rounded-xl transition-all duration-300 ${
                selectedRole === "institution" 
                  ? "bg-purple-500/30 border-2 border-purple-500" 
                  : "bg-purple-500/10 border border-purple-500/20 hover:bg-purple-500/20"
              }`}
            >
              <BuildingOffice2Icon className="w-8 h-8 text-purple-500" />
              <div className="text-left">
                <h3 className="text-lg font-semibold text-white">Institution</h3>
                <p className="text-sm text-gray-400">University/School</p>
              </div>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleRoleSelect("student")}
              className={`w-full flex items-center space-x-4 p-4 rounded-xl transition-all duration-300 ${
                selectedRole === "student" 
                  ? "bg-purple-500/30 border-2 border-purple-500" 
                  : "bg-purple-500/10 border border-purple-500/20 hover:bg-purple-500/20"
              }`}
            >
              <UserIcon className="w-8 h-8 text-purple-500" />
              <div className="text-left">
                <h3 className="text-lg font-semibold text-white">Student</h3>
                <p className="text-sm text-gray-400">View and manage credentials</p>
              </div>
            </motion.button>

            <div className="mt-8 text-center">
              <p className="text-gray-400 text-sm mb-4">
                A small transaction fee (0.01 ETH) is required to register your role.
                The payment will be processed via MetaMask and stored on IPFS.
              </p>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                disabled={!selectedRole}
                onClick={handleConfirmRole}
                className={`w-full py-3 rounded-xl ${
                  selectedRole
                    ? "bg-green-500/20 border border-green-500/40 text-green-400 hover:bg-green-500/30"
                    : "bg-gray-500/20 border border-gray-500/40 text-gray-400 cursor-not-allowed"
                } transition-all duration-300`}
              >
                Pay with MetaMask
              </motion.button>
            </div>
          </div>
        )}

        {transactionStatus === "processing" && (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="w-16 h-16 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin mb-6"></div>
            <p className="text-gray-400 text-center">
              Please confirm the transaction in your MetaMask wallet...<br/>
              Waiting for confirmation.
            </p>
          </div>
        )}

        {transactionStatus === "success" && (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="w-16 h-16 bg-green-500/20 rounded-full border-2 border-green-500 flex items-center justify-center mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-gray-400 text-center mb-4">
              Payment successful! Your {selectedRole} role has been confirmed.
            </p>
            
            <div className="space-y-3 w-full">
              {transactionHash && (
                <div className="mb-2 bg-purple-500/10 rounded-lg p-3 max-w-full overflow-hidden">
                  <p className="text-gray-500 text-xs mb-1">Transaction Hash:</p>
                  <p className="text-purple-400 text-xs break-all">{transactionHash}</p>
                  <a 
                    href={`/verify-transaction?txHash=${transactionHash}`}
                    className="text-xs text-purple-400 hover:text-purple-300 mt-1 block"
                  >
                    Verify Transaction
                  </a>
                </div>
              )}
              
              {ipfsHash && (
                <div className="mb-2 bg-blue-500/10 rounded-lg p-3 max-w-full overflow-hidden">
                  <p className="text-gray-500 text-xs mb-1">IPFS Storage:</p>
                  <p className="text-blue-400 text-xs break-all">{ipfsHash}</p>
                  <a 
                    href={`https://gateway.pinata.cloud/ipfs/${ipfsHash}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-xs text-purple-400 hover:text-purple-300 mt-1 block"
                  >
                    View on IPFS Gateway
                  </a>
                </div>
              )}
            </div>
          </div>
        )}

        {transactionStatus === "error" && (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="w-16 h-16 bg-red-500/20 rounded-full border-2 border-red-500 flex items-center justify-center mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <p className="text-gray-400 text-center mb-6">
              Transaction failed or was rejected. Please try again.
            </p>
            <button
              onClick={() => setTransactionStatus("idle")}
              className="px-6 py-2 rounded-xl bg-purple-500/10 border border-purple-500/40 text-purple-400 hover:bg-purple-500/20 transition-all duration-300"
            >
              Try Again
            </button>
          </div>
        )}

        {transactionStatus === "idle" && (
          <button
            onClick={onClose}
            className="mt-6 w-full py-2 text-sm text-gray-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
        )}
      </motion.div>
    </motion.div>
  );
} 