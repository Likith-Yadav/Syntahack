import { useState } from 'react';
import { motion } from 'framer-motion';
import { ShareIcon, QrCodeIcon, DocumentDuplicateIcon, CheckCircleIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';
import { Credential } from '../services/credentialService';

interface ShareCredentialsProps {
  credentials: Credential[];
  shareCredential: (credential: Credential, verifierName: string, verifierAddress: string) => string | undefined;
}

export default function ShareCredentials({ credentials, shareCredential }: ShareCredentialsProps) {
  const [selectedCredential, setSelectedCredential] = useState<Credential | null>(null);
  const [verifierName, setVerifierName] = useState('');
  const [verifierAddress, setVerifierAddress] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Filter credentials based on search
  const filteredCredentials = credentials.filter(credential => 
    credential.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    credential.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Handle sharing
  const handleShare = () => {
    if (!selectedCredential || !verifierName || !verifierAddress) return;
    
    const url = shareCredential(selectedCredential, verifierName, verifierAddress);
    if (url) {
      setShareUrl(url);
    }
  };

  // Copy to clipboard
  const copyToClipboard = () => {
    if (shareUrl) {
      navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Reset form
  const resetForm = () => {
    setSelectedCredential(null);
    setVerifierName('');
    setVerifierAddress('');
    setShareUrl(null);
  };

  return (
    <div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-black/40 border border-purple-500/20 rounded-2xl p-8 mb-8"
      >
        <div className="flex items-center mb-6">
          <ShareIcon className="w-8 h-8 text-purple-500 mr-3" />
          <h2 className="text-2xl font-semibold text-purple-300">Share Credentials</h2>
        </div>

        {shareUrl ? (
          <div className="bg-black/30 border border-purple-500/10 rounded-xl p-8">
            <div className="flex flex-col items-center mb-6">
              <CheckCircleIcon className="w-16 h-16 text-green-500 mb-4" />
              <h3 className="text-xl font-medium text-white">Credential Shared Successfully!</h3>
              <p className="text-gray-400 text-center mt-2">
                The credential has been shared with {verifierName}. They can verify it using the link below.
              </p>
            </div>
            
            <div className="bg-black/60 border border-purple-500/20 rounded-xl p-4 mb-6">
              <p className="text-gray-400 text-sm mb-2">Verification URL:</p>
              <div className="flex">
                <input 
                  type="text" 
                  value={shareUrl} 
                  readOnly 
                  className="w-full bg-black/50 border border-purple-500/20 rounded-l-lg px-4 py-3 text-white focus:outline-none"
                />
                <button 
                  onClick={copyToClipboard}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-4 rounded-r-lg flex items-center"
                >
                  {copied ? 
                    <CheckCircleIcon className="w-5 h-5" /> : 
                    <DocumentDuplicateIcon className="w-5 h-5" />
                  }
                </button>
              </div>
            </div>
            
            <div className="flex justify-end">
              <button
                onClick={resetForm}
                className="px-6 py-3 rounded-xl bg-purple-500/10 border border-purple-500/20 hover:bg-purple-500/20 transition-all duration-300 text-purple-400 hover:text-purple-300"
              >
                Share Another Credential
              </button>
            </div>
          </div>
        ) : (
          <>
            {selectedCredential ? (
              <div className="bg-black/30 border border-purple-500/10 rounded-xl p-6">
                <h3 className="text-xl font-medium text-white mb-4">Share "{selectedCredential.title}"</h3>
                
                <div className="space-y-4 mb-6">
                  <div>
                    <label className="block text-gray-400 mb-2">Verifier Name</label>
                    <input
                      type="text"
                      placeholder="Enter the name of the verifier (e.g. Company, University)"
                      value={verifierName}
                      onChange={(e) => setVerifierName(e.target.value)}
                      className="w-full bg-black/50 border border-purple-500/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500/40 transition-all duration-300"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-gray-400 mb-2">Verifier Wallet Address</label>
                    <input
                      type="text"
                      placeholder="Enter the wallet address of the verifier"
                      value={verifierAddress}
                      onChange={(e) => setVerifierAddress(e.target.value)}
                      className="w-full bg-black/50 border border-purple-500/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500/40 transition-all duration-300"
                    />
                  </div>
                </div>
                
                <div className="flex justify-between">
                  <button
                    onClick={() => setSelectedCredential(null)}
                    className="px-6 py-3 rounded-xl bg-gray-500/10 border border-gray-500/20 hover:bg-gray-500/20 transition-all duration-300 text-gray-400 hover:text-gray-300"
                  >
                    Back
                  </button>
                  
                  <button
                    onClick={handleShare}
                    disabled={!verifierName || !verifierAddress}
                    className={`px-6 py-3 rounded-xl ${
                      verifierName && verifierAddress
                        ? "bg-purple-500/10 border border-purple-500/20 hover:bg-purple-500/20 transition-all duration-300 text-purple-400 hover:text-purple-300"
                        : "bg-gray-500/10 border border-gray-500/20 text-gray-500 cursor-not-allowed"
                    }`}
                  >
                    Share Credential
                  </button>
                </div>
              </div>
            ) : (
              <>
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
                        ? "You don't have any credentials to share yet."
                        : "No credentials match your search criteria. Try a different search term."}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-gray-400 mb-4">
                      Select a credential below to share with employers, institutions, or other verifiers.
                    </p>
                    
                    {filteredCredentials.map(credential => (
                      <motion.div
                        key={credential.id}
                        whileHover={{ scale: 1.01 }}
                        className="bg-black/50 border border-purple-500/20 rounded-xl p-6 hover:border-purple-500/40 transition-all duration-300 cursor-pointer"
                        onClick={() => setSelectedCredential(credential)}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="text-xl font-medium text-white mb-2">{credential.title}</h3>
                            <p className="text-gray-400">{credential.description}</p>
                          </div>
                          <div className="bg-purple-500/10 rounded-full p-2">
                            <QrCodeIcon className="w-6 h-6 text-purple-400" />
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </motion.div>
    </div>
  );
} 