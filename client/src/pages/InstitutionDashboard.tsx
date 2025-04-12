import { motion } from "framer-motion";
import { BuildingOffice2Icon, DocumentCheckIcon, UserGroupIcon, IdentificationIcon, DocumentTextIcon, ArrowLeftIcon, ChartBarIcon } from "@heroicons/react/24/outline";
import { useActiveAccount } from "thirdweb/react";
import { useEffect, useState } from "react";
import { getIpfsHashesForAddress, retrieveTransactionData, isPinataConfigured, storeTransactionData } from "../services/ipfsService";
import IssueCredential from "../components/IssueCredential";
import ManageStudents from "../components/ManageStudents";
import CredentialAnalytics from "../components/CredentialAnalytics";
import { Student, Credential, saveCredentialToLocalStorage } from "../services/credentialService";

export default function InstitutionDashboard() {
  const account = useActiveAccount();
  const [transactionInfo, setTransactionInfo] = useState<{
    transactionHash?: string;
    ipfsHash?: string;
    timestamp?: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // State for managing views
  const [activeView, setActiveView] = useState<'dashboard' | 'issue-credential' | 'manage-students' | 'analytics'>('dashboard');
  
  // States for different features
  const [students, setStudents] = useState<Student[]>([]);
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  useEffect(() => {
    if (account?.address) {
      setIsLoading(true);
      fetchUserData(account.address.toLowerCase());
      // Load students and credentials when dashboard loads
      loadStudents();
      loadCredentials();
    }
  }, [account?.address]);

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

  // Load students from localStorage
  const loadStudents = () => {
    try {
      const storedStudents = localStorage.getItem(`students_${account?.address?.toLowerCase()}`);
      if (storedStudents) {
        setStudents(JSON.parse(storedStudents));
      }
    } catch (error) {
      console.error("Error loading students:", error);
    }
  };

  // Load credentials from localStorage
  const loadCredentials = () => {
    try {
      const storedCredentials = localStorage.getItem(`credentials_${account?.address?.toLowerCase()}`);
      if (storedCredentials) {
        setCredentials(JSON.parse(storedCredentials));
      }
    } catch (error) {
      console.error("Error loading credentials:", error);
    }
  };

  // Save new student
  const saveStudent = (student: Student) => {
    const updatedStudents = [...students, student];
    setStudents(updatedStudents);
    localStorage.setItem(`students_${account?.address?.toLowerCase()}`, JSON.stringify(updatedStudents));
  };

  // Save new credential
  const saveCredential = (credential: Credential) => {
    const updatedCredentials = [...credentials, credential];
    setCredentials(updatedCredentials);
    // Using our service's function for consistency
    if (account?.address) {
      saveCredentialToLocalStorage(credential, account.address);
    }
    loadCredentials(); // Reload to ensure state is up to date
  };

  // Render functions for different views
  const renderDashboard = () => (
    <>
      {/* User Information Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-blue-900/30 to-indigo-900/30 border border-blue-500/20 rounded-2xl p-8 mb-10"
      >
        <h2 className="text-2xl font-semibold mb-6 text-blue-300">Your Institution Profile</h2>
        {isLoading ? (
          <div className="flex justify-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <IdentificationIcon className="w-6 h-6 text-blue-400" />
              <span className="text-gray-300">Address: {account?.address ? `${account.address.slice(0, 12)}...${account.address.slice(-8)}` : 'Not connected'}</span>
            </div>
            <div className="flex items-center space-x-3">
              <BuildingOffice2Icon className="w-6 h-6 text-blue-400" />
              <span className="text-gray-300">Role: <span className="text-blue-300 font-medium">Institution</span></span>
            </div>
            {transactionInfo?.timestamp && (
              <div className="flex items-center space-x-3">
                <DocumentTextIcon className="w-6 h-6 text-blue-400" />
                <span className="text-gray-300">
                  Registration Date: {new Date(transactionInfo.timestamp).toLocaleDateString()}
                </span>
              </div>
            )}
            {transactionInfo?.transactionHash && (
              <div className="flex items-center space-x-3">
                <DocumentTextIcon className="w-6 h-6 text-blue-400" />
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
                <DocumentTextIcon className="w-6 h-6 text-blue-400" />
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
        {/* Issue Credential Card */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="bg-black/80 border border-blue-500/20 rounded-2xl p-8"
        >
          <DocumentCheckIcon className="w-14 h-14 text-blue-500 mb-6" />
          <h2 className="text-xl font-semibold mb-3">Issue Credential</h2>
          <p className="text-gray-400 mb-6 min-h-[50px]">
            Issue new academic credentials to students
          </p>
          <button 
            onClick={() => setActiveView('issue-credential')}
            className="w-full py-3 rounded-lg bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/20 transition-all duration-300 text-blue-400 hover:text-blue-300">
            Issue New Credential
          </button>
        </motion.div>

        {/* Manage Students Card */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="bg-black/80 border border-blue-500/20 rounded-2xl p-8"
        >
          <UserGroupIcon className="w-14 h-14 text-blue-500 mb-6" />
          <h2 className="text-xl font-semibold mb-3">Manage Students</h2>
          <p className="text-gray-400 mb-6 min-h-[50px]">
            View and manage student records
          </p>
          <button 
            onClick={() => setActiveView('manage-students')}
            className="w-full py-3 rounded-lg bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/20 transition-all duration-300 text-blue-400 hover:text-blue-300">
            View Students
          </button>
        </motion.div>

        {/* Credential Analytics Card */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="bg-black/80 border border-blue-500/20 rounded-2xl p-8"
        >
          <ChartBarIcon className="w-14 h-14 text-blue-500 mb-6" />
          <h2 className="text-xl font-semibold mb-3">Analytics</h2>
          <p className="text-gray-400 mb-6 min-h-[50px]">
            View credential issuance statistics
          </p>
          <button 
            onClick={() => setActiveView('analytics')}
            className="w-full py-3 rounded-lg bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/20 transition-all duration-300 text-blue-400 hover:text-blue-300">
            View Analytics
          </button>
        </motion.div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-black/80 border border-blue-500/20 rounded-2xl p-8"
        >
          <h3 className="text-xl font-semibold mb-4 text-blue-300">Recent Students</h3>
          {students.length === 0 ? (
            <p className="text-gray-400">No students registered yet</p>
          ) : (
            <ul className="space-y-4">
              {students.slice(0, 3).map(student => (
                <li key={student.id} className="border-b border-blue-500/10 pb-3">
                  <div className="font-medium text-white">{student.name}</div>
                  <div className="text-sm text-gray-400">
                    {student.walletAddress.substring(0, 10)}...{student.walletAddress.substring(student.walletAddress.length - 8)}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-black/80 border border-blue-500/20 rounded-2xl p-8"
        >
          <h3 className="text-xl font-semibold mb-4 text-blue-300">Recent Credentials</h3>
          {credentials.length === 0 ? (
            <p className="text-gray-400">No credentials issued yet</p>
          ) : (
            <ul className="space-y-4">
              {credentials.slice(0, 3).map(credential => (
                <li key={credential.id} className="border-b border-blue-500/10 pb-3">
                  <div className="font-medium text-white">{credential.title}</div>
                  <div className="text-sm text-blue-300">
                    Issued to: {credential.studentName}
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
      case 'issue-credential':
        return <IssueCredential saveCredential={saveCredential} />;
      case 'manage-students':
        return <ManageStudents saveStudent={saveStudent} />;
      case 'analytics':
        return <CredentialAnalytics />;
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
              <BuildingOffice2Icon className="w-8 h-8 text-blue-500" />
              <h1 className="text-2xl font-bold">Institution Dashboard</h1>
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
            className="flex items-center space-x-2 text-blue-400 hover:text-blue-300 mb-8 group"
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