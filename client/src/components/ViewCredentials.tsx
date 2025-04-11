import { useState } from 'react';
import { motion } from 'framer-motion';
import { DocumentTextIcon, AcademicCapIcon, CalendarIcon, ClockIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';
import { Credential } from '../services/credentialService';

interface ViewCredentialsProps {
  credentials: Credential[];
}

export default function ViewCredentials({ credentials }: ViewCredentialsProps) {
  const [selectedCredential, setSelectedCredential] = useState<Credential | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Filter credentials based on search
  const filteredCredentials = credentials.filter(credential => 
    credential.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    credential.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    credential.studentName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Format date for display
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-black/40 border border-purple-500/20 rounded-2xl p-8 mb-8"
      >
        <div className="flex items-center mb-6">
          <DocumentTextIcon className="w-8 h-8 text-purple-500 mr-3" />
          <h2 className="text-2xl font-semibold text-purple-300">My Academic Credentials</h2>
        </div>

        {/* Search bar */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search credentials by title, description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-black/50 border-2 border-purple-500/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500/40 transition-all duration-300"
          />
        </div>

        {/* Credentials list */}
        {filteredCredentials.length === 0 ? (
          <div className="bg-black/30 border border-purple-500/10 rounded-xl p-8 text-center">
            <ExclamationCircleIcon className="w-12 h-12 text-purple-400 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-purple-300 mb-2">No Credentials Found</h3>
            <p className="text-gray-400">
              {credentials.length === 0 
                ? "You don't have any credentials issued to your wallet address yet." 
                : "No credentials match your search criteria. Try a different search term."}
            </p>
            <p className="text-gray-400 mt-4">
              If you are expecting to see credentials, make sure:
              <br/>
              1. You are connected with the correct wallet address
              <br/>
              2. The institution has issued credentials to your current wallet address
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredCredentials.map(credential => (
              <motion.div
                key={credential.id}
                whileHover={{ scale: 1.02 }}
                className="bg-black/50 border border-purple-500/20 rounded-xl p-6 hover:border-purple-500/40 transition-all duration-300 cursor-pointer"
                onClick={() => setSelectedCredential(credential)}
              >
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-medium text-white">{credential.title}</h3>
                  <div className="bg-purple-500/10 rounded-full p-2">
                    <AcademicCapIcon className="w-6 h-6 text-purple-400" />
                  </div>
                </div>
                <p className="text-gray-400 mb-4 line-clamp-2">{credential.description}</p>
                <div className="flex justify-between text-sm text-gray-500">
                  <div className="flex items-center">
                    <CalendarIcon className="w-4 h-4 mr-1" />
                    <span>Issued: {formatDate(credential.issueDate)}</span>
                  </div>
                  {credential.expiryDate && (
                    <div className="flex items-center">
                      <ClockIcon className="w-4 h-4 mr-1" />
                      <span>Expires: {formatDate(credential.expiryDate)}</span>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Credential Details Modal */}
      {selectedCredential && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gradient-to-b from-purple-900/30 to-black/90 border-2 border-purple-500/30 rounded-2xl p-8 w-full max-w-2xl shadow-2xl shadow-purple-500/10"
          >
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center">
                <AcademicCapIcon className="w-8 h-8 text-purple-400 mr-3" />
                <h2 className="text-2xl font-semibold text-purple-300">Credential Details</h2>
              </div>
              <button
                onClick={() => setSelectedCredential(null)}
                className="text-gray-400 hover:text-white"
              >
                ×
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="text-2xl font-bold text-white mb-2">{selectedCredential.title}</h3>
                <p className="text-gray-300">{selectedCredential.description}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-black/40 rounded-xl p-4">
                  <p className="text-sm text-gray-400 mb-1">Issued To</p>
                  <p className="text-white">{selectedCredential.studentName}</p>
                </div>
                <div className="bg-black/40 rounded-xl p-4">
                  <p className="text-sm text-gray-400 mb-1">Wallet Address</p>
                  <p className="text-white break-all">{selectedCredential.studentWallet}</p>
                </div>
                <div className="bg-black/40 rounded-xl p-4">
                  <p className="text-sm text-gray-400 mb-1">Issue Date</p>
                  <p className="text-white">{formatDate(selectedCredential.issueDate)}</p>
                </div>
                {selectedCredential.expiryDate && (
                  <div className="bg-black/40 rounded-xl p-4">
                    <p className="text-sm text-gray-400 mb-1">Expiry Date</p>
                    <p className="text-white">{formatDate(selectedCredential.expiryDate)}</p>
                  </div>
                )}
              </div>

              {/* Metadata */}
              {selectedCredential.metadata && Object.keys(selectedCredential.metadata).length > 0 && (
                <div>
                  <h4 className="text-lg font-medium text-purple-300 mb-3">Additional Information</h4>
                  <div className="bg-black/40 rounded-xl p-4 space-y-2">
                    {Object.entries(selectedCredential.metadata).map(([key, value]) => (
                      <div key={key} className="flex justify-between border-b border-purple-500/10 pb-2">
                        <span className="text-gray-400">{key}:</span>
                        <span className="text-white">{value.toString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Credential ID (for verification purposes) */}
              <div>
                <h4 className="text-sm font-medium text-purple-300 mb-2">Credential ID</h4>
                <div className="bg-black/40 rounded-xl p-3 text-xs text-gray-400 break-all">
                  {selectedCredential.id}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  This ID can be used to verify the authenticity of this credential.
                </p>
              </div>

              {/* Action buttons */}
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  onClick={() => {
                    if (selectedCredential.metadata?.ipfsHash) {
                      window.open(`https://gateway.pinata.cloud/ipfs/${selectedCredential.metadata.ipfsHash}`, '_blank');
                    }
                  }}
                  disabled={!selectedCredential.metadata?.ipfsHash}
                  className={`px-6 py-3 rounded-xl ${
                    selectedCredential.metadata?.ipfsHash
                      ? "bg-blue-500/10 border-2 border-blue-500/20 hover:bg-blue-500/20 transition-all duration-300 text-blue-400 hover:text-blue-300"
                      : "bg-gray-500/10 border-2 border-gray-500/20 text-gray-500 cursor-not-allowed"
                  } font-medium`}
                >
                  View on IPFS
                </button>
                <button
                  onClick={() => {
                    const shareUrl = `${window.location.origin}/verify?id=${selectedCredential.id}`;
                    navigator.clipboard.writeText(shareUrl);
                    alert('Verification URL copied to clipboard!');
                  }}
                  className="px-6 py-3 rounded-xl bg-purple-500/10 border-2 border-purple-500/20 hover:bg-purple-500/20 transition-all duration-300 text-purple-400 hover:text-purple-300 font-medium"
                >
                  Copy Verification Link
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
} 