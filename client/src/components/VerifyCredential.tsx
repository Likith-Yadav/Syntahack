import { useState } from 'react';
import { motion } from 'framer-motion';
import { useActiveAccount } from 'thirdweb/react';
import { DocumentCheckIcon, DocumentTextIcon, UserIcon, AcademicCapIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { Credential, verifyCredential } from '../services/credentialService';
import { retrieveTransactionData } from '../services/ipfsService';

export default function VerifyCredential() {
  const account = useActiveAccount();
  const [credentialId, setCredentialId] = useState('');
  const [credential, setCredential] = useState<Credential | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<'idle' | 'verifying' | 'valid' | 'invalid'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [ipfsData, setIpfsData] = useState<any>(null);

  const handleVerify = async () => {
    if (!credentialId) {
      setError('Please enter a credential ID');
      return;
    }

    if (!account?.address) {
      setError('Please connect your wallet to verify credentials');
      return;
    }

    setVerificationStatus('verifying');
    setError(null);

    try {
      const result = await verifyCredential(credentialId, account.address);
      
      if (result.isValid && result.credential) {
        setCredential(result.credential);
        setVerificationStatus('valid');

        // Try to fetch IPFS data if available
        if (result.credential.metadata?.ipfsHash) {
          try {
            const ipfsResult = await retrieveTransactionData(result.credential.metadata.ipfsHash);
            if (ipfsResult) {
              setIpfsData(ipfsResult);
            }
          } catch (ipfsError) {
            console.error('Error fetching IPFS data:', ipfsError);
          }
        }
      } else {
        setVerificationStatus('invalid');
        setError(result.message);
      }
    } catch (error) {
      setVerificationStatus('invalid');
      setError(error instanceof Error ? error.message : 'Failed to verify credential');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-black/40 border border-purple-500/20 rounded-2xl p-8 mb-8"
    >
      <div className="flex items-center mb-6">
        <DocumentCheckIcon className="w-8 h-8 text-purple-500 mr-3" />
        <h2 className="text-2xl font-semibold text-purple-300">Verify Credential</h2>
      </div>

      {/* Verification Input */}
      <div className="space-y-6">
        <div>
          <label className="block text-gray-300 mb-2">Credential ID</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={credentialId}
              onChange={(e) => setCredentialId(e.target.value)}
              placeholder="Enter credential ID"
              className="flex-1 bg-black/50 border-2 border-purple-500/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500/40 transition-all duration-300"
            />
            <button
              onClick={handleVerify}
              disabled={verificationStatus === 'verifying'}
              className="px-6 py-3 bg-purple-500/10 border-2 border-purple-500/20 rounded-xl text-purple-400 hover:bg-purple-500/20 hover:text-purple-300 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {verificationStatus === 'verifying' ? 'Verifying...' : 'Verify'}
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-4 text-red-400">
            {error}
          </div>
        )}

        {/* Verification Result */}
        {verificationStatus !== 'idle' && credential && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-black/50 border border-purple-500/20 rounded-xl p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-purple-300">Credential Details</h3>
              <div className="flex items-center">
                {verificationStatus === 'valid' ? (
                  <CheckCircleIcon className="w-6 h-6 text-green-500 mr-2" />
                ) : (
                  <XCircleIcon className="w-6 h-6 text-red-500 mr-2" />
                )}
                <span className={`font-medium ${
                  verificationStatus === 'valid' ? 'text-green-400' : 'text-red-400'
                }`}>
                  {verificationStatus === 'valid' ? 'Valid' : 'Invalid'}
                </span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center">
                <DocumentTextIcon className="w-5 h-5 text-purple-400 mr-3" />
                <div>
                  <p className="text-gray-400 text-sm">Title</p>
                  <p className="text-white">{credential.title}</p>
                </div>
              </div>

              <div className="flex items-center">
                <UserIcon className="w-5 h-5 text-purple-400 mr-3" />
                <div>
                  <p className="text-gray-400 text-sm">Student</p>
                  <p className="text-white">{credential.studentName}</p>
                </div>
              </div>

              <div className="flex items-center">
                <AcademicCapIcon className="w-5 h-5 text-purple-400 mr-3" />
                <div>
                  <p className="text-gray-400 text-sm">Issuer</p>
                  <p className="text-white">{credential.issuerName}</p>
                </div>
              </div>

              <div className="flex items-center">
                <DocumentCheckIcon className="w-5 h-5 text-purple-400 mr-3" />
                <div>
                  <p className="text-gray-400 text-sm">Issue Date</p>
                  <p className="text-white">{new Date(credential.issueDate).toLocaleDateString()}</p>
                </div>
              </div>

              {credential.expiryDate && (
                <div className="flex items-center">
                  <DocumentCheckIcon className="w-5 h-5 text-purple-400 mr-3" />
                  <div>
                    <p className="text-gray-400 text-sm">Expiry Date</p>
                    <p className="text-white">{new Date(credential.expiryDate).toLocaleDateString()}</p>
                  </div>
                </div>
              )}

              {credential.metadata && Object.keys(credential.metadata).length > 0 && (
                <div className="mt-4">
                  <h4 className="text-lg font-medium text-purple-300 mb-2">Additional Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(credential.metadata).map(([key, value]) => (
                      <div key={key} className="bg-black/30 rounded-lg p-3">
                        <p className="text-gray-400 text-sm">{key}</p>
                        <p className="text-white">{value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {ipfsData && (
                <div className="mt-4">
                  <h4 className="text-lg font-medium text-purple-300 mb-2">IPFS Data</h4>
                  <div className="bg-black/30 rounded-lg p-4">
                    <pre className="text-sm text-gray-300 overflow-x-auto">
                      {JSON.stringify(ipfsData, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
} 