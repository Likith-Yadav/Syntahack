import React, { useState, useEffect, useCallback } from 'react';
import { useActiveAccount } from "thirdweb/react";
import { motion } from "framer-motion";
import { useNavigate } from 'react-router-dom';
import { 
  storeTransactionData, 
  retrieveTransactionData, 
  getIpfsHashesForAddress, 
  getTransactionsForAddress,
  isPinataConfigured,
  TransactionData 
} from '../services/ipfsService';

// Declare window ethereum for MetaMask
declare global {
  interface Window {
    ethereum: any;
    localStorage: Storage;
  }
}

interface PendingUser {
  address: string;
  role: 'institution' | 'student';
  timestamp: number;
  paymentConfirmed?: boolean;
  transactionHash?: string;
  ipfsHash?: string;
  status?: string;
}

export default function AdminDashboard() {
  const account = useActiveAccount();
  const navigate = useNavigate();
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [approvedUsers, setApprovedUsers] = useState<PendingUser[]>([]);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUserAddress, setNewUserAddress] = useState('');
  const [newUserRole, setNewUserRole] = useState<'institution' | 'student'>('institution');
  const [isProcessingTransaction, setIsProcessingTransaction] = useState(false);
  const [transactionStatus, setTransactionStatus] = useState<"idle" | "processing" | "success" | "error">("idle");
  const [transactionHash, setTransactionHash] = useState<string | null>(null);
  const [ipfsHash, setIpfsHash] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadUsers = useCallback(async () => {
    setIsRefreshing(true);

    try {
      // Get pending users
      const storedPending = window.localStorage.getItem("pendingUsers");
      console.log("Raw pendingUsers from localStorage:", storedPending);

      let pendingUsersList: PendingUser[] = [];

      if (storedPending) {
        try {
          const parsedPending = JSON.parse(storedPending);
          console.log("Parsed pendingUsers:", parsedPending);

          // Include all pending requests, not just those with paymentConfirmed
          pendingUsersList = parsedPending.map((user: PendingUser) => ({
            ...user,
            status: user.status || "pending",
            paymentConfirmed: user.paymentConfirmed !== undefined ? user.paymentConfirmed : true, // Default to true if not set
          }));

          pendingUsersList.sort((a: PendingUser, b: PendingUser) => b.timestamp - a.timestamp);
          console.log("Processed pendingUsersList:", pendingUsersList);
        } catch (error) {
          console.error("Error parsing pendingUsers:", error);
        }
      } else {
        console.log("No pendingUsers found in localStorage");
      }

      // Get approved users
      const storedApproved = window.localStorage.getItem("approvedUsers");
      console.log("Raw approvedUsers from localStorage:", storedApproved);

      let approvedUsersList: PendingUser[] = [];

      if (storedApproved) {
        try {
          const parsedApproved = JSON.parse(storedApproved);
          console.log("Parsed approvedUsers:", parsedApproved);

          approvedUsersList = parsedApproved.map((user: PendingUser) => ({
            ...user,
            status: user.status || "approved",
          }));

          approvedUsersList.sort((a: PendingUser, b: PendingUser) => b.timestamp - a.timestamp);
          console.log("Processed approvedUsersList:", approvedUsersList);
        } catch (error) {
          console.error("Error parsing approvedUsers:", error);
        }
      } else {
        console.log("No approvedUsers found in localStorage");
      }

      // Update state with users from localStorage
      setPendingUsers(pendingUsersList);
      setApprovedUsers(approvedUsersList);

      // Try to retrieve additional data from IPFS if Pinata is configured
      if (isPinataConfigured() && account?.address) {
        try {
          const ipfsHashes = await getTransactionsForAddress(account.address);
          console.log("Found IPFS hashes for admin:", ipfsHashes);

          for (const hash of ipfsHashes) {
            const ipfsData = await retrieveTransactionData(hash);
            console.log(`IPFS data for hash ${hash}:`, ipfsData);

            if (ipfsData && ipfsData.address && ipfsData.role) {
              if (ipfsData.paymentConfirmed && !ipfsData.status) {
                ipfsData.status = "pending";
              }

              if (ipfsData.status === "pending") {
                const pendingIndex = pendingUsersList.findIndex(
                  user => user.address.toLowerCase() === ipfsData.address.toLowerCase()
                );

                if (pendingIndex !== -1) {
                  pendingUsersList[pendingIndex] = {
                    ...pendingUsersList[pendingIndex],
                    ...ipfsData,
                    ipfsHash: hash,
                  };
                } else {
                  pendingUsersList.push({
                    ...ipfsData,
                    ipfsHash: hash,
                  });
                }
              } else if (ipfsData.status === "approved") {
                const approvedIndex = approvedUsersList.findIndex(
                  user => user.address.toLowerCase() === ipfsData.address.toLowerCase()
                );

                if (approvedIndex !== -1) {
                  approvedUsersList[approvedIndex] = {
                    ...approvedUsersList[approvedIndex],
                    ...ipfsData,
                    ipfsHash: hash,
                  };
                } else {
                  approvedUsersList.push({
                    ...ipfsData,
                    ipfsHash: hash,
                  });
                }
              }
            }
          }

          setPendingUsers([...pendingUsersList]);
          setApprovedUsers([...approvedUsersList]);

          window.localStorage.setItem("pendingUsers", JSON.stringify(pendingUsersList));
          window.localStorage.setItem("approvedUsers", JSON.stringify(approvedUsersList));
          console.log("Updated localStorage with IPFS-enhanced data");
        } catch (error) {
          console.error("Error retrieving IPFS data:", error);
        }
      }
    } catch (error) {
      console.error("General error in loadUsers:", error);
    } finally {
      setIsRefreshing(false);
    }
  }, [account]);

  useEffect(() => {
    if (account?.address) {
      const isAdmin = account.address.toLowerCase() === import.meta.env.VITE_ADMIN_ADDRESS?.toLowerCase();
      if (!isAdmin) {
        navigate("/");
        return;
      }
    } else {
      navigate("/");
      return;
    }

    loadUsers();
  }, [account, navigate, loadUsers]);

  useEffect(() => {
    const refreshInterval = setInterval(() => {
      console.log("Auto-refreshing admin dashboard");
      loadUsers();
    }, 5000);

    return () => clearInterval(refreshInterval);
  }, [loadUsers]);

  const handleRefresh = () => {
    loadUsers();
  };

  const handleApprove = async (user: PendingUser) => {
    try {
      console.log("Approving user - start:", { user, address: user.address, role: user.role });
      console.log("Current localStorage state:", {
        pendingUsers: localStorage.getItem("pendingUsers"),
        approvedUsers: localStorage.getItem("approvedUsers")
      });

      let currentPendingUsers: PendingUser[] = [];
      try {
        const pendingData = window.localStorage.getItem("pendingUsers");
        currentPendingUsers = pendingData ? JSON.parse(pendingData) : [];
      } catch (error) {
        console.error("Error parsing pendingUsers:", error);
      }

      const updatedPendingUsers = currentPendingUsers.filter(
        (u: PendingUser) => u.address.toLowerCase() !== user.address.toLowerCase()
      );
      console.log("Updated pending users:", updatedPendingUsers);

      window.localStorage.setItem("pendingUsers", JSON.stringify(updatedPendingUsers));

      let currentApprovedUsers: PendingUser[] = [];
      try {
        const approvedData = window.localStorage.getItem("approvedUsers");
        currentApprovedUsers = approvedData ? JSON.parse(approvedData) : [];
      } catch (error) {
        console.error("Error parsing approvedUsers:", error);
      }

      const approvedUser: PendingUser = {
        ...user,
        paymentConfirmed: true,
        status: "approved",
        timestamp: Date.now(),
      };

      const updatedApprovedUsers = [...currentApprovedUsers, approvedUser];
      console.log("Updated approved users:", updatedApprovedUsers);

      window.localStorage.setItem("approvedUsers", JSON.stringify(updatedApprovedUsers));

      const normalizedAddress = user.address.toLowerCase();
      window.localStorage.setItem(`role_${normalizedAddress}`, user.role);
      console.log(`Directly stored role for ${normalizedAddress}: ${user.role}`);
      console.log("All localStorage keys after approval:", Object.keys(window.localStorage));

      try {
        const approvalData: TransactionData = {
          address: user.address,
          role: user.role,
          timestamp: Date.now(),
          transactionHash: user.transactionHash || "admin-approved",
          paymentConfirmed: true,
          status: "approved",
          ipfsHash: user.ipfsHash,
        };

        const hash = await storeTransactionData(approvalData);
        console.log("Approval stored on IPFS with hash:", hash);

        approvedUser.ipfsHash = hash;
        window.localStorage.setItem("approvedUsers", JSON.stringify(updatedApprovedUsers));
      } catch (ipfsError) {
        console.error("Failed to store approval on IPFS, but approval recorded locally:", ipfsError);
      }

      setPendingUsers(updatedPendingUsers);
      setApprovedUsers(updatedApprovedUsers);

      alert(`User ${user.address} has been approved as ${user.role}`);
      console.log("Approval completed successfully");

      loadUsers();
    } catch (error) {
      console.error("Error approving user:", error);
      alert("Failed to approve user. Please try again.");
    }
  };

  const handleReject = async (user: PendingUser) => {
    try {
      console.log("Rejecting user:", user);

      let currentPendingUsers: PendingUser[] = [];
      try {
        const pendingData = window.localStorage.getItem("pendingUsers");
        currentPendingUsers = pendingData ? JSON.parse(pendingData) : [];
      } catch (error) {
        console.error("Error parsing pendingUsers:", error);
      }

      const rejectedUser: PendingUser = {
        ...user,
        status: "rejected",
        timestamp: Date.now(),
      };

      const updatedPendingUsers = currentPendingUsers.filter(
        (u: PendingUser) => u.address.toLowerCase() !== user.address.toLowerCase()
      );
      console.log("Updated pending users after rejection:", updatedPendingUsers);

      window.localStorage.setItem("pendingUsers", JSON.stringify(updatedPendingUsers));

      try {
        const rejectionData: TransactionData = {
          address: user.address,
          role: user.role,
          timestamp: Date.now(),
          transactionHash: user.transactionHash || "admin-rejected",
          paymentConfirmed: true,
          status: "rejected",
          ipfsHash: user.ipfsHash,
        };

        const hash = await storeTransactionData(rejectionData);
        console.log("Rejection stored on IPFS with hash:", hash);
      } catch (ipfsError) {
        console.error("Failed to store rejection on IPFS, but rejection recorded locally:", ipfsError);
      }

      setPendingUsers(updatedPendingUsers);

      alert(`User ${user.address} has been rejected`);

      loadUsers();
    } catch (error) {
      console.error("Error rejecting user:", error);
      alert("Failed to reject user. Please try again.");
    }
  };

  const handleRemove = (user: PendingUser) => {
    try {
      console.log("Removing approved user:", user);

      let currentApprovedUsers: PendingUser[] = [];
      try {
        const approvedData = window.localStorage.getItem("approvedUsers");
        currentApprovedUsers = approvedData ? JSON.parse(approvedData) : [];
      } catch (error) {
        console.error("Error parsing approvedUsers:", error);
      }

      const updatedApprovedUsers = currentApprovedUsers.filter(
        (u: PendingUser) => u.address.toLowerCase() !== user.address.toLowerCase()
      );
      console.log("Updated approved users after removal:", updatedApprovedUsers);

      window.localStorage.setItem("approvedUsers", JSON.stringify(updatedApprovedUsers));

      window.localStorage.removeItem(`role_${user.address.toLowerCase()}`);

      setApprovedUsers(updatedApprovedUsers);

      alert(`User ${user.address} has been removed`);

      loadUsers();
    } catch (error) {
      console.error("Error removing user:", error);
      alert("Failed to remove user. Please try again.");
    }
  };

  const handleAddUser = async () => {
    if (!newUserAddress || !account?.address) return;

    // Start transaction process
    setIsProcessingTransaction(true);
    setTransactionStatus("processing");
    setIpfsHash(null);

    try {
      // The fee amount in ETH
      const feeAmount = "0.01";
      
      // Request transaction from MetaMask
      const params = {
        from: account.address,
        to: import.meta.env.VITE_ADMIN_ADDRESS || "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65", // Admin address as recipient
        value: (parseFloat(feeAmount) * 10**18).toString(16), // Convert ETH to Wei and then to hex
      };
      
      // Request transaction
      const txHash = await window.ethereum.request({
        method: 'eth_sendTransaction',
        params: [params],
      });
      
      // Store transaction hash
      setTransactionHash(txHash);
      console.log("Transaction successful, hash:", txHash);
      
      // Create new user object with payment confirmation and transaction hash
      const newUser: PendingUser = {
        address: newUserAddress.toLowerCase(),
        role: newUserRole,
        timestamp: Date.now(),
        paymentConfirmed: true,
        transactionHash: txHash,
        status: 'approved'
      };
      console.log("Created new user object:", newUser);

      // Store on IPFS
      try {
        // Check if Pinata is configured properly
        if (isPinataConfigured()) {
          const hash = await storeTransactionData(newUser as TransactionData);
          setIpfsHash(hash);
          newUser.ipfsHash = hash;
          console.log("New user stored on IPFS with hash:", hash);
        } else {
          console.warn("Pinata not configured, storing in localStorage only");
          throw new Error("Pinata not configured");
        }
      } catch (ipfsError) {
        console.error("Failed to store on IPFS, but transaction successful:", ipfsError);
      }

      // Get current approved users from localStorage
      let currentApprovedUsers: PendingUser[] = [];
      try {
        const approvedData = window.localStorage.getItem('approvedUsers');
        currentApprovedUsers = approvedData ? JSON.parse(approvedData) : [];
      } catch (error) {
        console.error("Error parsing approvedUsers:", error);
        currentApprovedUsers = [];
      }

      // Check if user is already approved
      const isAlreadyApproved = currentApprovedUsers.some(
        (u: PendingUser) => u.address.toLowerCase() === newUserAddress.toLowerCase()
      );

      if (!isAlreadyApproved) {
        // Add to approved list
        const updatedApprovedUsers = [...currentApprovedUsers, newUser];
        console.log("Updated approved users:", updatedApprovedUsers);
        
        // Store back to localStorage
        window.localStorage.setItem('approvedUsers', JSON.stringify(updatedApprovedUsers));
        
        // Ensure address is always lowercase for consistent lookup
        const normalizedAddress = newUserAddress.toLowerCase();
        
        // Explicitly store the role for the user - this is critical for direct access
        window.localStorage.setItem(`role_${normalizedAddress}`, newUserRole);
        console.log(`Directly stored role for ${normalizedAddress}: ${newUserRole}`);
        console.log("All localStorage keys:", Object.keys(window.localStorage));
        
        // Update state
        setApprovedUsers(updatedApprovedUsers);
        
        // Transaction successful
        setTransactionStatus("success");
        
        // Wait a moment before closing the modal
        await new Promise(resolve => setTimeout(resolve, 1500));

    // Reset form
    setNewUserAddress('');
    setNewUserRole('institution');
    setShowAddUserModal(false);
        
        // Reload users to ensure UI is updated
        loadUsers();
      } else {
        // User already approved
        setTransactionStatus("error");
        alert("This address is already approved");
      }
    } catch (error) {
      console.error("Transaction error:", error);
      setTransactionStatus("error");
    } finally {
      setIsProcessingTransaction(false);
      // Reset transaction status after a delay
      setTimeout(() => {
        setTransactionStatus("idle");
        setTransactionHash(null);
      }, 3000);
    }
  };

  if (!account?.address) {
    return null; // Don't show anything while redirecting
  }

  if (account.address.toLowerCase() !== import.meta.env.VITE_ADMIN_ADDRESS.toLowerCase()) {
    return null; // Don't show anything while redirecting
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="bg-black/50 backdrop-blur-md border-b border-purple-500/20">
        <div className="container mx-auto px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <motion.div
                className="bg-purple-500/20 rounded-full p-2"
                whileHover={{ scale: 1.05 }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
              </motion.div>
              <h1 className="text-2xl font-bold">Admin Dashboard</h1>
            </div>
            <div className="text-sm text-gray-400">
              Connected as: {account?.address ? `${account.address.slice(0, 6)}...${account.address.slice(-4)}` : 'Not connected'}
            </div>
          </div>
        </div>
      </header>

      {/* Admin Information Card */}
      <div className="container mx-auto px-8 pt-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-purple-900/30 to-red-900/30 border border-red-500/20 rounded-2xl p-6 mb-8"
        >
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-semibold mb-3 text-red-300">Admin Profile</h2>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                  </svg>
                  <span className="text-gray-300">Address: {account?.address ? `${account.address.slice(0, 12)}...${account.address.slice(-8)}` : 'Not connected'}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  <span className="text-gray-300">Role: <span className="text-red-300 font-medium">Administrator</span></span>
                </div>
                <div className="flex items-center space-x-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span className="text-gray-300">Status: <span className="text-green-400 font-medium">Active</span></span>
                </div>
              </div>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className={`px-4 py-2 rounded-lg ${
                  isRefreshing
                    ? "bg-gray-500/10 border border-gray-500/20 text-gray-400 cursor-not-allowed"
                    : "bg-purple-500/10 border border-purple-500/20 hover:bg-purple-500/20 text-purple-400 hover:text-purple-300"
                }`}
              >
                {isRefreshing ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-purple-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Refreshing
                  </span>
                ) : (
                  "Refresh"
                )}
              </button>
              <button
                onClick={() => setShowAddUserModal(true)}
                className="px-4 py-2 rounded-lg bg-purple-500/10 border border-purple-500/20 hover:bg-purple-500/20 text-purple-400 hover:text-purple-300"
              >
                Add User
              </button>
            </div>
          </div>
        </motion.div>
      </div>
      
      {/* Rest of the dashboard content */}
      <main className="container mx-auto px-8 py-4">
        <div className="space-y-12">
          {/* Pending Approvals Section */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-black/40 p-8 rounded-2xl backdrop-blur-sm border border-purple-500/20"
          >
            <h2 className="text-3xl font-semibold mb-4 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent flex items-center">
              Pending Approvals
              {pendingUsers.length > 0 && (
                <span className="ml-4 px-3 py-1 text-sm bg-purple-500/80 text-white rounded-full">
                  {pendingUsers.length} {pendingUsers.length === 1 ? "request" : "requests"}
                </span>
              )}
            </h2>
            <p className="text-gray-400 mb-6">
              These users are waiting for your approval to access the platform.
            </p>
            
            {/* Debug information for admin */}
            <div className="mb-8 p-4 border border-blue-500/30 rounded-xl bg-blue-500/5">
              <h3 className="text-blue-400 text-sm font-medium mb-2">Debug Information</h3>
              <p className="text-xs text-gray-400 mb-2">
                LocalStorage keys: {Object.keys(window.localStorage).join(", ")}
              </p>
              <p className="text-xs text-gray-400">
                Pending users in state: {pendingUsers.length}
              </p>
              <button
                onClick={() => console.log("Current pending users:", pendingUsers)}
                className="mt-2 text-xs text-blue-400 hover:text-blue-300 underline"
              >
                Log pending users to console
              </button>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {pendingUsers.map(user => (
                <motion.div
                  key={user.address}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-8 bg-purple-900/20 border-2 border-purple-500/20 rounded-xl hover:border-purple-500/40 transition-all duration-300"
                >
                  <div className="flex justify-between items-start mb-4">
                    <p className="text-gray-200 break-all font-medium">Address: {user.address}</p>
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      Needs Approval
                    </span>
                  </div>
                  <p className="text-gray-200 mb-2 font-medium">
                    Role: <span className="capitalize">{user.role}</span>
                  </p>
                  <div className="mb-6 flex items-center">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mr-2 ${
                      user.paymentConfirmed 
                        ? "bg-green-100 text-green-800" 
                        : "bg-yellow-100 text-yellow-800"
                    }`}>
                      {user.paymentConfirmed ? "Payment Confirmed" : "Payment Pending"}
                    </span>
                    {user.transactionHash && (
                      <span
                        title={user.transactionHash}
                        className="text-xs text-gray-400 truncate max-w-[150px] hover:text-purple-400 cursor-pointer"
                        onClick={() => console.log("Transaction hash:", user.transactionHash)}
                      >
                        {user.transactionHash.substring(0, 10)}...
                      </span>
                    )}
                  </div>
                  
                  {/* Timestamp display */}
                  <div className="mb-4 text-xs text-gray-400">
                    Requested: {new Date(user.timestamp).toLocaleString()}
                  </div>
                  
                  {user.ipfsHash && (
                    <div className="bg-blue-500/10 rounded-lg p-3 mb-6">
                      <p className="text-gray-500 text-xs mb-1">IPFS Storage:</p>
                      <p className="text-blue-400 text-xs break-all">{user.ipfsHash}</p>
                      <a
                        href={`https://gateway.pinata.cloud/ipfs/${user.ipfsHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-purple-400 hover:text-purple-300 mt-1 block"
                      >
                        View on IPFS
                      </a>
                    </div>
                  )}
                  <div className="flex gap-4">
                    <button
                      onClick={() => handleApprove(user)}
                      className="flex-1 px-6 py-4 rounded-xl bg-green-500/10 border-2 border-green-500/20 hover:bg-green-500/20 transition-all duration-300 text-green-400 hover:text-green-300 font-medium"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleReject(user)}
                      className="flex-1 px-6 py-4 rounded-xl bg-red-500/10 border-2 border-red-500/20 hover:bg-red-500/20 transition-all duration-300 text-red-400 hover:text-red-300 font-medium"
                    >
                      Reject
                    </button>
                  </div>
                </motion.div>
              ))}
              {pendingUsers.length === 0 && (
                <div className="col-span-full flex items-center justify-center py-20 text-gray-400 text-lg">
                  No pending approvals
                </div>
              )}
            </div>
          </motion.div>

          {/* Approved Users Section */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-black/40 p-8 rounded-2xl backdrop-blur-sm border border-purple-500/20"
          >
            <h2 className="text-3xl font-semibold mb-4 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent flex items-center">
              Approved Users
              {approvedUsers.length > 0 && (
                <span className="ml-4 px-3 py-1 text-sm bg-green-500/80 text-white rounded-full">
                  {approvedUsers.length} {approvedUsers.length === 1 ? "user" : "users"}
                </span>
              )}
            </h2>
            <p className="text-gray-400 mb-10">These users have been approved and can access the platform.</p>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {approvedUsers.map(user => (
                <motion.div
                  key={user.address}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-8 bg-green-900/10 border-2 border-green-500/20 rounded-xl hover:border-green-500/40 transition-all duration-300"
                >
                  <div className="flex justify-between items-start mb-4">
                    <p className="text-gray-200 break-all font-medium">Address: {user.address}</p>
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Approved
                    </span>
                  </div>
                  <p className="text-gray-200 mb-2 font-medium">
                    Role: <span className="capitalize">{user.role}</span>
                  </p>
                  <div className="mb-6 flex items-center">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 mr-2">
                      Payment Confirmed
                    </span>
                    {user.transactionHash && (
                      <span
                        title={user.transactionHash}
                        className="text-xs text-gray-400 truncate max-w-[150px] hover:text-purple-400 cursor-pointer"
                      >
                        {user.transactionHash.substring(0, 10)}...
                      </span>
                    )}
                  </div>
                  {user.ipfsHash && (
                    <div className="bg-blue-500/10 rounded-lg p-3 mb-6">
                      <p className="text-gray-500 text-xs mb-1">IPFS Storage:</p>
                      <p className="text-blue-400 text-xs break-all">{user.ipfsHash}</p>
                      <a
                        href={`https://gateway.pinata.cloud/ipfs/${user.ipfsHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-purple-400 hover:text-purple-300 mt-1 block"
                      >
                        View on IPFS
                      </a>
                    </div>
                  )}
                  <button
                    onClick={() => handleRemove(user)}
                    className="w-full px-6 py-4 rounded-xl bg-red-500/10 border-2 border-red-500/20 hover:bg-red-500/20 transition-all duration-300 text-red-400 hover:text-red-300 font-medium"
                  >
                    Remove
                  </button>
                </motion.div>
              ))}
              {approvedUsers.length === 0 && (
                <div className="col-span-full flex items-center justify-center py-20 text-gray-400 text-lg">
                  No approved users
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Add User Modal */}
        {showAddUserModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-black/90 border-2 border-purple-500/30 rounded-2xl p-8 w-full max-w-md mx-4 shadow-2xl shadow-purple-500/10"
            >
              <h2 className="text-3xl font-semibold mb-8 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                {transactionStatus === "processing"
                  ? "Processing Payment"
                  : transactionStatus === "success"
                  ? "User Added Successfully"
                  : transactionStatus === "error"
                  ? "Transaction Failed"
                  : "Add New User"}
              </h2>
              
              {transactionStatus === "idle" && (
              <div className="space-y-6">
                <div>
                  <label className="block text-gray-300 mb-2 font-medium">Wallet Address</label>
                  <input
                    type="text"
                    value={newUserAddress}
                      onChange={e => setNewUserAddress(e.target.value)}
                    className="w-full bg-black/50 border-2 border-purple-500/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500/40 transition-all duration-300"
                    placeholder="0x..."
                  />
                </div>
                <div>
                  <label className="block text-gray-300 mb-2 font-medium">Role</label>
                  <select
                    value={newUserRole}
                      onChange={e => setNewUserRole(e.target.value as "institution" | "student")}
                    className="w-full bg-black/50 border-2 border-purple-500/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500/40 transition-all duration-300"
                  >
                    <option value="institution">Institution</option>
                    <option value="student">Student</option>
                  </select>
                </div>
                  <div className="mt-4">
                    <p className="text-gray-400 text-sm mb-4 text-center">
                      Adding a user requires a small transaction fee (0.01 ETH)
                      <br />
                      Payment will be processed via MetaMask.
                    </p>
                    
                    <div className="border-t border-purple-500/20 mt-6 pt-6">
                      <p className="text-gray-400 text-sm mb-4 text-center font-medium">
                        Fast Admin-Only Options
                      </p>
                      <button
                        onClick={() => {
                          // Skip payment verification and add user directly as approved
                          if (!newUserAddress) return;
                          
                          console.log("Fast adding user:", newUserAddress, "with role:", newUserRole);
                          
                          // Create new user object with admin approval
                          const newUser: PendingUser = {
                            address: newUserAddress.toLowerCase(),
                            role: newUserRole,
                            timestamp: Date.now(),
                            paymentConfirmed: true,
                            transactionHash: "admin-direct-add",
                            status: 'approved'
                          };
                          
                          // Get current approved users
                          let currentApprovedUsers: PendingUser[] = [];
                          try {
                            const approvedData = localStorage.getItem('approvedUsers');
                            currentApprovedUsers = approvedData ? JSON.parse(approvedData) : [];
                          } catch (error) {
                            console.error("Error parsing approvedUsers:", error);
                          }
                          
                          // Check if already approved
                          const normalizedAddress = newUserAddress.toLowerCase();
                          const isAlreadyApproved = currentApprovedUsers.some(
                            (user: PendingUser) => user.address.toLowerCase() === normalizedAddress
                          );
                          
                          if (!isAlreadyApproved) {
                            // Add to approved users
                            const updatedApprovedUsers = [...currentApprovedUsers, newUser];
                            localStorage.setItem('approvedUsers', JSON.stringify(updatedApprovedUsers));
                            
                            // Store role directly
                            localStorage.setItem(`role_${normalizedAddress}`, newUserRole);
                            console.log(`Directly stored role for ${normalizedAddress}: ${newUserRole}`);
                            
                            // Update state
                            setApprovedUsers(updatedApprovedUsers);
                            
                            // Notify success
                            alert(`User ${normalizedAddress} has been fast-added as ${newUserRole}`);
                            
                            // Reset and close
                            setNewUserAddress('');
                            setNewUserRole('institution');
                            setShowAddUserModal(false);
                            
                            // Reload users
                            loadUsers();
                          } else {
                            alert("This address is already approved");
                          }
                        }}
                        disabled={!newUserAddress}
                        className={`w-full py-3 rounded-xl mb-2 ${
                          newUserAddress
                            ? "bg-blue-500/10 border-2 border-blue-500/20 hover:bg-blue-500/20 text-blue-400 hover:text-blue-300"
                            : "bg-gray-500/10 border-2 border-gray-500/20 text-gray-400 cursor-not-allowed"
                        } transition-all duration-300`}
                      >
                        Fast Add (Admin Only)
                      </button>
                    </div>
                  </div>
                <div className="flex justify-end gap-4 pt-6">
                  <button
                    onClick={() => setShowAddUserModal(false)}
                    className="px-6 py-3 rounded-xl bg-red-500/10 border-2 border-red-500/20 hover:bg-red-500/20 transition-all duration-300 text-red-400 hover:text-red-300 font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddUser}
                      disabled={!newUserAddress}
                      className={`px-6 py-3 rounded-xl transition-all duration-300 font-medium ${
                        newUserAddress
                          ? "bg-green-500/10 border-2 border-green-500/20 hover:bg-green-500/20 text-green-400 hover:text-green-300"
                          : "bg-gray-500/10 border-2 border-gray-500/20 text-gray-400 cursor-not-allowed"
                      }`}
                    >
                      Pay & Add with MetaMask
                    </button>
                  </div>
                </div>
              )}
              
              {transactionStatus === "processing" && (
                <div className="flex flex-col items-center py-6">
                  <div className="w-16 h-16 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin mb-6"></div>
                  <p className="text-gray-400 text-center">
                    Please confirm the transaction in MetaMask...
                    <br />
                    Waiting for confirmation.
                  </p>
                </div>
              )}
              
              {transactionStatus === "success" && (
                <div className="flex flex-col items-center py-6">
                  <div className="w-16 h-16 bg-green-500/20 rounded-full border-2 border-green-500 flex items-center justify-center mb-6">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-8 w-8 text-green-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                  <p className="text-gray-400 text-center mb-4">
                    Payment successful! User has been added with {newUserRole} role.
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
                <div className="flex flex-col items-center py-6">
                  <div className="w-16 h-16 bg-red-500/20 rounded-full border-2 border-red-500 flex items-center justify-center mb-6">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-8 w-8 text-red-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </div>
                  <p className="text-gray-400 text-center mb-6">Transaction failed. Please try again.</p>
                  <button
                    onClick={() => setTransactionStatus("idle")}
                    className="px-6 py-2 rounded-xl bg-purple-500/10 border border-purple-500/40 text-purple-400 hover:bg-purple-500/20 transition-all duration-300"
                  >
                    Try Again
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </main>
    </div>
  );
} 