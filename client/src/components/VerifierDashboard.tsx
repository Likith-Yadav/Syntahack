import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useActiveAccount } from 'thirdweb/react';
import { DocumentCheckIcon, ClipboardDocumentListIcon, ClockIcon } from '@heroicons/react/24/outline';
import VerifyCredential from './VerifyCredential';
import { mockGetVerificationHistory } from '../services/mockService';

interface VerificationHistory {
  id: string;
  credentialId: string;
  credentialTitle: string;
  studentName: string;
  studentWallet: string;
  timestamp: number;
  status: 'valid' | 'invalid';
}

const VerifierDashboard: React.FC = () => {
  const account = useActiveAccount();
  const [activeTab, setActiveTab] = useState<'verify' | 'history'>('verify');
  const [verificationHistory, setVerificationHistory] = useState<VerificationHistory[]>([]);

  useEffect(() => {
    if (account?.address) {
      loadVerificationHistory();
    }
  }, [account?.address]);

  const loadVerificationHistory = () => {
    try {
      const history = mockGetVerificationHistory(account?.address || '');
      setVerificationHistory(history);
    } catch (error) {
      console.error('Error loading verification history:', error);
    }
  };

  if (!account) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <DocumentCheckIcon className="w-12 h-12 text-purple-500 mx-auto mb-4" />
          <p className="text-xl text-purple-300">Please connect your wallet to access the verifier dashboard</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-black/40 border border-purple-500/20 rounded-2xl p-8 mb-8"
        >
          <div className="flex items-center mb-6">
            <DocumentCheckIcon className="w-8 h-8 text-purple-500 mr-3" />
            <h1 className="text-2xl font-semibold text-purple-300">Verifier Dashboard</h1>
          </div>

          {/* Navigation Tabs */}
          <div className="flex space-x-4 mb-8">
            <button
              onClick={() => setActiveTab('verify')}
              className={`px-6 py-3 rounded-xl transition-all duration-300 ${
                activeTab === 'verify'
                  ? 'bg-purple-500/20 text-purple-300 border-2 border-purple-500/40'
                  : 'bg-black/50 text-gray-400 hover:text-white'
              }`}
            >
              <div className="flex items-center">
                <DocumentCheckIcon className="w-5 h-5 mr-2" />
                Verify Credential
              </div>
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-6 py-3 rounded-xl transition-all duration-300 ${
                activeTab === 'history'
                  ? 'bg-purple-500/20 text-purple-300 border-2 border-purple-500/40'
                  : 'bg-black/50 text-gray-400 hover:text-white'
              }`}
            >
              <div className="flex items-center">
                <ClipboardDocumentListIcon className="w-5 h-5 mr-2" />
                Verification History
              </div>
            </button>
          </div>

          {/* Content Area */}
          <div className="mt-8">
            {activeTab === 'verify' ? (
              <VerifyCredential />
            ) : (
              <div className="space-y-6">
                {verificationHistory.length === 0 ? (
                  <div className="text-center py-12">
                    <ClipboardDocumentListIcon className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400">No verification history yet</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {verificationHistory.map((verification) => (
                      <motion.div
                        key={verification.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-black/50 border border-purple-500/20 rounded-xl p-6"
                      >
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-medium text-purple-300">
                            {verification.credentialTitle}
                          </h3>
                          <span
                            className={`px-3 py-1 rounded-full text-sm ${
                              verification.status === 'valid'
                                ? 'bg-green-900/20 text-green-400'
                                : 'bg-red-900/20 text-red-400'
                            }`}
                          >
                            {verification.status}
                          </span>
                        </div>
                        <div className="space-y-2">
                          <p className="text-gray-400 text-sm">Student</p>
                          <p className="text-white">{verification.studentName}</p>
                          <p className="text-gray-400 text-sm">Wallet</p>
                          <p className="text-white font-mono text-sm">
                            {verification.studentWallet.slice(0, 6)}...{verification.studentWallet.slice(-4)}
                          </p>
                          <div className="flex items-center text-gray-400 text-sm mt-4">
                            <ClockIcon className="w-4 h-4 mr-2" />
                            {new Date(verification.timestamp).toLocaleString()}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default VerifierDashboard; 