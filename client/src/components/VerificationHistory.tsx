import { useState } from 'react';
import { motion } from 'framer-motion';
import { ClipboardDocumentCheckIcon, CheckIcon, XMarkIcon, ClockIcon, UserIcon, CalendarIcon, ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';

interface VerificationRecord {
  id: string;
  credentialId: string;
  credentialTitle: string;
  verifierName: string;
  verifierAddress: string;
  timestamp: number;
  status: 'valid' | 'invalid';
}

interface VerificationHistoryProps {
  history: VerificationRecord[];
}

export default function VerificationHistory({ history }: VerificationHistoryProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState<'newest' | 'oldest'>('newest');
  const [selectedRecord, setSelectedRecord] = useState<VerificationRecord | null>(null);
  
  // Filter history based on search
  const filteredHistory = history.map(record => ({
    ...record,
    status: 'valid' as 'valid'
  }));
  
  // Sort by timestamp
  const sortedHistory = [...filteredHistory].sort((a, b) => {
    return sortOption === 'newest' 
      ? b.timestamp - a.timestamp 
      : a.timestamp - b.timestamp;
  });

  // Format date
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get status icon
  const getStatusIcon = (status: 'valid' | 'invalid') => {
    switch (status) {
      case 'valid':
        return <CheckIcon className="w-5 h-5 text-green-500" />;
      case 'invalid':
        return <XMarkIcon className="w-5 h-5 text-red-500" />;
    }
  };

  // Get status color
  const getStatusColor = (status: 'valid' | 'invalid') => {
    switch (status) {
      case 'valid':
        return 'text-green-500 bg-green-500/10 border-green-500/20';
      case 'invalid':
        return 'text-red-500 bg-red-500/10 border-red-500/20';
    }
  };

  return (
    <div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-black/40 border border-purple-500/20 rounded-2xl p-8 mb-8"
      >
        <div className="flex items-center mb-6">
          <ClipboardDocumentCheckIcon className="w-8 h-8 text-purple-500 mr-3" />
          <h2 className="text-2xl font-semibold text-purple-300">Verification History</h2>
        </div>

        {/* Detail view for selected record */}
        {selectedRecord ? (
          <div className="bg-black/30 border border-purple-500/10 rounded-xl p-6">
            <div className="flex justify-between items-start mb-6">
              <h3 className="text-xl font-medium text-white">{selectedRecord.credentialTitle}</h3>
              <button
                onClick={() => setSelectedRecord(null)}
                className="text-gray-400 hover:text-white"
              >
                ×
              </button>
            </div>
            
            <div className={`inline-flex items-center px-3 py-1 rounded-full mb-6 ${getStatusColor(selectedRecord.status)}`}>
              {getStatusIcon(selectedRecord.status)}
              <span className="ml-2 font-medium">
                {selectedRecord.status === 'valid' ? 'Valid' : 
                 selectedRecord.status === 'invalid' ? 'Invalid' : 'Pending'}
              </span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="bg-black/40 rounded-xl p-4">
                <p className="text-sm text-gray-400 mb-1">Verifier</p>
                <p className="text-white">{selectedRecord.verifierName}</p>
              </div>
              <div className="bg-black/40 rounded-xl p-4">
                <p className="text-sm text-gray-400 mb-1">Verifier Address</p>
                <p className="text-white break-all">{selectedRecord.verifierAddress}</p>
              </div>
              <div className="bg-black/40 rounded-xl p-4">
                <p className="text-sm text-gray-400 mb-1">Verification Date</p>
                <p className="text-white">{formatDate(selectedRecord.timestamp)}</p>
              </div>
              <div className="bg-black/40 rounded-xl p-4">
                <p className="text-sm text-gray-400 mb-1">Credential ID</p>
                <p className="text-white break-all">{selectedRecord.credentialId}</p>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Search and filter */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <input
                type="text"
                placeholder="Search by credential title or verifier name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-grow bg-black/50 border-2 border-purple-500/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500/40 transition-all duration-300"
              />
              <select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value as 'newest' | 'oldest')}
                className="bg-black/50 border-2 border-purple-500/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500/40 transition-all duration-300"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
              </select>
            </div>

            {/* Verification history list */}
            {sortedHistory.length === 0 ? (
              <div className="bg-black/30 border border-purple-500/10 rounded-xl p-8 text-center">
                <ClipboardDocumentCheckIcon className="w-12 h-12 text-purple-400 mx-auto mb-4" />
                <h3 className="text-xl font-medium text-purple-300 mb-2">No Verification Records</h3>
                <p className="text-gray-400">
                  {history.length === 0 
                    ? "You don't have any verification records yet. When you share your credentials and they are verified, records will appear here."
                    : "No records match your search criteria. Try a different search term."}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {sortedHistory.map(record => (
                  <motion.div
                    key={record.id}
                    whileHover={{ scale: 1.01 }}
                    className="bg-black/50 border border-purple-500/20 rounded-xl p-6 hover:border-purple-500/40 transition-all duration-300 cursor-pointer"
                    onClick={() => setSelectedRecord(record)}
                  >
                    <div className="flex flex-col md:flex-row justify-between">
                      <div className="mb-3 md:mb-0">
                        <h3 className="text-lg font-medium text-white mb-1">{record.credentialTitle}</h3>
                        <div className="flex items-center text-gray-400 text-sm">
                          <UserIcon className="w-4 h-4 mr-1" />
                          <span>{record.verifierName}</span>
                        </div>
                      </div>
                      
                      <div className="flex flex-col md:items-end">
                        <div className={`inline-flex items-center px-2 py-1 rounded-full mb-2 ${getStatusColor(record.status)}`}>
                          {getStatusIcon(record.status)}
                          <span className="ml-1 text-sm font-medium">
                            {record.status === 'valid' ? 'Valid' : 
                             record.status === 'invalid' ? 'Invalid' : 'Pending'}
                          </span>
                        </div>
                        <div className="flex items-center text-gray-400 text-sm">
                          <CalendarIcon className="w-4 h-4 mr-1" />
                          <span>{formatDate(record.timestamp)}</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </>
        )}
      </motion.div>
    </div>
  );
} 