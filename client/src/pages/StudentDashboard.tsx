import { motion } from "framer-motion";
import { UserIcon, DocumentTextIcon, ShareIcon, IdentificationIcon } from "@heroicons/react/24/outline";
import { useActiveAccount } from "thirdweb/react";
import { useEffect, useState } from "react";
import { getIpfsHashesForAddress, retrieveTransactionData, isPinataConfigured } from "../services/ipfsService";

export default function StudentDashboard() {
  const account = useActiveAccount();
  const [transactionInfo, setTransactionInfo] = useState<{
    transactionHash?: string;
    ipfsHash?: string;
    timestamp?: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (account?.address) {
      setIsLoading(true);
      fetchUserData(account.address.toLowerCase());
    }
  }, [account]);

  // Fetch user data from IPFS if available, or from localStorage as fallback
  const fetchUserData = async (address: string) => {
    try {
      // First try to get data from IPFS
      if (isPinataConfigured()) {
        console.log("Pinata configured, checking IPFS for user data");
        const ipfsHashes = await getIpfsHashesForAddress(address);
        
        if (ipfsHashes.length > 0) {
          // Sort to get the most recent transaction (assuming we want the latest)
          // We'll fetch data for each hash to see timestamp
          let mostRecentData = null;
          let mostRecentTimestamp = 0;
          let mostRecentHash = "";
          
          for (const hash of ipfsHashes) {
            const data = await retrieveTransactionData(hash);
            if (data && data.timestamp > mostRecentTimestamp) {
              mostRecentData = data;
              mostRecentTimestamp = data.timestamp;
              mostRecentHash = hash;
            }
          }
          
          if (mostRecentData) {
            console.log("Found transaction data on IPFS:", mostRecentData);
            setTransactionInfo({
              transactionHash: mostRecentData.transactionHash,
              ipfsHash: mostRecentHash,
              timestamp: mostRecentData.timestamp
            });
            setIsLoading(false);
            return;
          }
        }
      }
      
      // Fall back to localStorage if no IPFS data
      console.log("No IPFS data found or Pinata not configured, checking localStorage");
      const approvedData = window.localStorage.getItem("approvedUsers");
      if (approvedData) {
        const approvedUsers = JSON.parse(approvedData);
        const user = approvedUsers.find(
          (user: any) => user.address.toLowerCase() === address
        );
        
        if (user) {
          console.log("Found user data in localStorage:", user);
          setTransactionInfo({
            transactionHash: user.transactionHash,
            ipfsHash: user.ipfsHash,
            timestamp: user.timestamp
          });
        }
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header with increased padding top to give space below navbar */}
      <header className="bg-black/50 backdrop-blur-md border-b border-purple-500/20">
        <div className="container mx-auto px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <UserIcon className="w-8 h-8 text-purple-500" />
              <h1 className="text-2xl font-bold">Student Dashboard</h1>
            </div>
            <div className="text-sm text-gray-400">
              Connected as: {account?.address ? `${account.address.slice(0, 6)}...${account.address.slice(-4)}` : 'Not connected'}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content - Increased padding-top for more space below navbar */}
      <div className="container mx-auto px-8 pt-16">
        {/* User Information Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 border border-purple-500/20 rounded-2xl p-8 mb-10"
        >
          <h2 className="text-2xl font-semibold mb-6 text-purple-300">Your Student Profile</h2>
          {isLoading ? (
            <div className="flex justify-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <IdentificationIcon className="w-6 h-6 text-purple-400" />
                <span className="text-gray-300">Address: {account?.address ? `${account.address.slice(0, 12)}...${account.address.slice(-8)}` : 'Not connected'}</span>
              </div>
              <div className="flex items-center space-x-3">
                <UserIcon className="w-6 h-6 text-purple-400" />
                <span className="text-gray-300">Role: <span className="text-purple-300 font-medium">Student</span></span>
              </div>
              {transactionInfo?.timestamp && (
                <div className="flex items-center space-x-3">
                  <DocumentTextIcon className="w-6 h-6 text-purple-400" />
                  <span className="text-gray-300">
                    Registration Date: {new Date(transactionInfo.timestamp).toLocaleDateString()}
                  </span>
                </div>
              )}
              {transactionInfo?.transactionHash && (
                <div className="flex items-center space-x-3">
                  <DocumentTextIcon className="w-6 h-6 text-purple-400" />
                  <span className="text-gray-300">
                    Transaction: 
                    <a 
                      href={`https://sepolia.etherscan.io/tx/${transactionInfo.transactionHash}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="ml-1 text-blue-400 hover:underline"
                    >
                      View on Etherscan
                    </a>
                  </span>
                </div>
              )}
              {transactionInfo?.ipfsHash && (
                <div className="flex items-center space-x-3">
                  <DocumentTextIcon className="w-6 h-6 text-purple-400" />
                  <span className="text-gray-300">
                    IPFS: 
                    <a 
                      href={`https://gateway.pinata.cloud/ipfs/${transactionInfo.ipfsHash}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="ml-1 text-blue-400 hover:underline"
                    >
                      View on IPFS
                    </a>
                  </span>
                </div>
              )}
            </div>
          )}
        </motion.div>

        {/* Dashboard Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {/* My Credentials Card */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-black/80 border border-purple-500/20 rounded-2xl p-8"
          >
            <DocumentTextIcon className="w-14 h-14 text-purple-500 mb-6" />
            <h2 className="text-xl font-semibold mb-3">My Credentials</h2>
            <p className="text-gray-400 mb-6 min-h-[50px]">
              View and manage your academic credentials
            </p>
            <button className="w-full py-3 rounded-lg bg-purple-500/10 border border-purple-500/20 hover:bg-purple-500/20 transition-all duration-300 text-purple-400 hover:text-purple-300">
              View Credentials
            </button>
          </motion.div>

          {/* Share Credentials Card */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-black/80 border border-purple-500/20 rounded-2xl p-8"
          >
            <ShareIcon className="w-14 h-14 text-purple-500 mb-6" />
            <h2 className="text-xl font-semibold mb-3">Share Credentials</h2>
            <p className="text-gray-400 mb-6 min-h-[50px]">
              Share your credentials with employers or institutions
            </p>
            <button className="w-full py-3 rounded-lg bg-purple-500/10 border border-purple-500/20 hover:bg-purple-500/20 transition-all duration-300 text-purple-400 hover:text-purple-300">
              Share Credentials
            </button>
          </motion.div>

          {/* Verification History Card */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-black/80 border border-purple-500/20 rounded-2xl p-8"
          >
            <DocumentTextIcon className="w-14 h-14 text-purple-500 mb-6" />
            <h2 className="text-xl font-semibold mb-3">Verification History</h2>
            <p className="text-gray-400 mb-6 min-h-[50px]">
              Track who has verified your credentials
            </p>
            <button className="w-full py-3 rounded-lg bg-purple-500/10 border border-purple-500/20 hover:bg-purple-500/20 transition-all duration-300 text-purple-400 hover:text-purple-300">
              View History
            </button>
          </motion.div>
        </div>
      </div>
    </div>
  );
} 