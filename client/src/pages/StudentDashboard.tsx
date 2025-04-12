import { motion } from "framer-motion";
import { UserIcon, DocumentTextIcon, ShareIcon, IdentificationIcon, ArrowLeftIcon, ClipboardDocumentCheckIcon } from "@heroicons/react/24/outline";
import { useActiveAccount } from "thirdweb/react";
import { useEffect, useState } from "react";
import { getIpfsHashesForAddress, retrieveTransactionData, isPinataConfigured } from "../services/ipfsService";
import { Credential, getStudentCredentials, mockGetCredentials } from "../services/credentialService";
import ViewCredentials from "../components/ViewCredentials";
import ShareCredentials from "../components/ShareCredentials";
import VerificationHistory from "../components/VerificationHistory";

export default function StudentDashboard() {
  const account = useActiveAccount();
  const [transactionInfo, setTransactionInfo] = useState<{
    transactionHash?: string;
    ipfsHash?: string;
    timestamp?: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // State for managing views
  const [activeView, setActiveView] = useState<'dashboard' | 'view-credentials' | 'share-credentials' | 'verification-history'>('dashboard');
  
  // State for credentials and verification history
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [verificationHistory, setVerificationHistory] = useState<{
    id: string;
    credentialId: string; 
    credentialTitle: string;
    verifierName: string;
    verifierAddress: string;
    timestamp: number;
    status: 'valid' | 'invalid';
  }[]>([]);

  useEffect(() => {
    if (account?.address) {
      setIsLoading(true);
      
      // Clear previously loaded data when account changes
      setCredentials([]);
      setVerificationHistory([]);
      setTransactionInfo(null);
      
      // Load new data for current account
      fetchUserData(account.address.toLowerCase());
      loadCredentials(account.address.toLowerCase());
      loadVerificationHistory(account.address.toLowerCase());
    }
  }, [account?.address]); // Only re-run when address changes

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
          (user: any) => user.address.toLowerCase() === address.toLowerCase()
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

  // Load student credentials
  const loadCredentials = (walletAddress: string) => {
    try {
      if (!walletAddress) {
        console.log("No wallet address provided, cannot load credentials");
        return;
      }
      
      console.log(`Loading credentials for wallet: ${walletAddress}`);
      
      // Use mockGetCredentials to fetch mock data
      const studentCredentials = mockGetCredentials();
      
      // Filter to only include credentials where studentWallet matches the current wallet
      const filteredCredentials = studentCredentials.filter(
        (cred: Credential) => cred.studentWallet.toLowerCase() === walletAddress.toLowerCase()
      );
      
      console.log(`Found ${filteredCredentials.length} credentials for this wallet`);
      
      // Sort credentials by issue date (newest first)
      const sortedCredentials = filteredCredentials.sort((a: Credential, b: Credential) => b.issueDate - a.issueDate);
      
      setCredentials(sortedCredentials);
    } catch (error) {
      console.error("Error loading credentials:", error);
      // Show error message to user
      alert("Error loading credentials. Please try refreshing the page.");
    }
  };

  // Load verification history
  const loadVerificationHistory = (walletAddress: string) => {
    try {
      // In a real app, this would fetch from blockchain/database
      // For demo purposes, we'll load from localStorage or generate sample data
      const storedHistory = localStorage.getItem(`verification_history_${walletAddress.toLowerCase()}`);
      
      if (storedHistory) {
        setVerificationHistory(JSON.parse(storedHistory));
      } else {
        // If no history exists, create empty array
        setVerificationHistory([]);
      }
    } catch (error) {
      console.error("Error loading verification history:", error);
    }
  };

  // Add verification record
  const addVerificationRecord = (
    credentialId: string,
    credentialTitle: string,
    verifierName: string,
    verifierAddress: string,
    status: 'valid' | 'invalid' = 'valid'
  ) => {
    if (!account?.address) return;
    
    const newRecord = {
      id: `verify_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      credentialId,
      credentialTitle,
      verifierName,
      verifierAddress,
      timestamp: Date.now(),
      status
    };
    
    const updatedHistory = [...verificationHistory, newRecord];
    setVerificationHistory(updatedHistory);
    
    localStorage.setItem(
      `verification_history_${account.address.toLowerCase()}`,
      JSON.stringify(updatedHistory)
    );
  };

  // Share credential with a verifier
  const shareCredential = (credential: Credential, verifierName: string, verifierAddress: string) => {
    if (!credential || !verifierName || !verifierAddress) return;
    
    // In a real app, this would generate a sharing link or send directly to verifier
    // For demo purposes, we'll just record it in the verification history
    addVerificationRecord(
      credential.id,
      credential.title,
      verifierName,
      verifierAddress,
      'valid'
    );
    
    // Return a "share link" that could be used in a real app
    return `https://example.com/verify/${credential.id}?source=${account?.address}`;
  };

  // Render dashboard home view
  const renderDashboard = () => (
    <>
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
              <div>
                <span className="text-gray-300">Address: {account?.address ? `${account.address.slice(0, 12)}...${account.address.slice(-8)}` : 'Not connected'}</span>
                <div className="text-xs text-gray-400 mt-1">
                  This is the wallet address that should match the one in your credentials
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <UserIcon className="w-6 h-6 text-purple-400" />
              <span className="text-gray-300">Role: <span className="text-purple-300 font-medium">Student</span></span>
            </div>
            <div className="flex items-center space-x-3">
              <DocumentTextIcon className="w-6 h-6 text-purple-400" />
              <span className="text-gray-300">Credentials: <span className="text-purple-300 font-medium">{credentials.length}</span></span>
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
          <button 
            onClick={() => setActiveView('view-credentials')}
            className="w-full py-3 rounded-lg bg-purple-500/10 border border-purple-500/20 hover:bg-purple-500/20 transition-all duration-300 text-purple-400 hover:text-purple-300">
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
          <button 
            onClick={() => setActiveView('share-credentials')}
            className="w-full py-3 rounded-lg bg-purple-500/10 border border-purple-500/20 hover:bg-purple-500/20 transition-all duration-300 text-purple-400 hover:text-purple-300">
            Share Credentials
          </button>
        </motion.div>

        {/* Verification History Card */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="bg-black/80 border border-purple-500/20 rounded-2xl p-8"
        >
          <ClipboardDocumentCheckIcon className="w-14 h-14 text-purple-500 mb-6" />
          <h2 className="text-xl font-semibold mb-3">Verification History</h2>
          <p className="text-gray-400 mb-6 min-h-[50px]">
            Track who has verified your credentials
          </p>
          <button 
            onClick={() => setActiveView('verification-history')}
            className="w-full py-3 rounded-lg bg-purple-500/10 border border-purple-500/20 hover:bg-purple-500/20 transition-all duration-300 text-purple-400 hover:text-purple-300">
            View History
          </button>
        </motion.div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-black/80 border border-purple-500/20 rounded-2xl p-8"
        >
          <h3 className="text-xl font-semibold mb-4 text-purple-300">Credential Summary</h3>
          <div className="space-y-4">
            <div className="flex justify-between border-b border-purple-500/10 pb-2">
              <span className="text-gray-400">Total Credentials:</span>
              <span className="text-white font-medium">{credentials.length}</span>
            </div>
            <div className="flex justify-between border-b border-purple-500/10 pb-2">
              <span className="text-gray-400">Recent Verifications:</span>
              <span className="text-white font-medium">{verificationHistory.length}</span>
            </div>
            <div className="flex justify-between pb-2">
              <span className="text-gray-400">Last Updated:</span>
              <span className="text-white font-medium">
                {credentials.length > 0 
                  ? new Date(Math.max(...credentials.map(c => c.issueDate))).toLocaleDateString() 
                  : 'N/A'}
              </span>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-black/80 border border-purple-500/20 rounded-2xl p-8"
        >
          <h3 className="text-xl font-semibold mb-4 text-purple-300">Recent Activity</h3>
          {verificationHistory.length === 0 && credentials.length === 0 ? (
            <p className="text-gray-400">No recent activity</p>
          ) : (
            <ul className="space-y-4">
              {/* Show recent verifications first */}
              {verificationHistory.slice(0, 2).map(record => (
                <li key={record.id} className="border-b border-purple-500/10 pb-3">
                  <div className="font-medium text-white">Credential Verification</div>
                  <div className="text-sm text-purple-300">
                    {record.credentialTitle}
                  </div>
                  <div className="text-xs text-gray-400 flex justify-between">
                    <span>{new Date(record.timestamp).toLocaleDateString()}</span>
                    <span className="text-green-400">
                      Valid
                    </span>
                  </div>
                </li>
              ))}
              
              {/* Then show recent credentials */}
              {credentials.slice(0, 2).map(credential => (
                <li key={credential.id} className="border-b border-purple-500/10 pb-3">
                  <div className="font-medium text-white">New Credential</div>
                  <div className="text-sm text-purple-300">
                    {credential.title}
                  </div>
                  <div className="text-xs text-gray-400">
                    {new Date(credential.issueDate).toLocaleDateString()}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </motion.div>
      </div>
    </>
  );

  // Render the active view based on state
  const renderContent = () => {
    switch (activeView) {
      case 'view-credentials':
        return <ViewCredentials credentials={credentials} />;
      case 'share-credentials':
        return <ShareCredentials credentials={credentials} shareCredential={shareCredential} />;
      case 'verification-history':
        return <VerificationHistory history={verificationHistory} />;
      default:
        return renderDashboard();
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
        {/* Back button when not on dashboard */}
        {activeView !== 'dashboard' && (
          <button 
            onClick={() => setActiveView('dashboard')} 
            className="flex items-center space-x-2 text-purple-400 hover:text-purple-300 mb-8 group"
          >
            <ArrowLeftIcon className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span>Back to Dashboard</span>
          </button>
        )}

        {/* Render content based on active view */}
        {renderContent()}
      </div>
    </div>
  );
} 