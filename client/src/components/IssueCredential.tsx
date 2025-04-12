import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { DocumentCheckIcon, UserIcon, AcademicCapIcon, CalendarIcon } from '@heroicons/react/24/outline';
import { storeTransactionData } from '../services/ipfsService';
import { useActiveAccount } from 'thirdweb/react';
import { Credential, Student, issueCredential } from '../services/credentialService';

interface IssueCredentialProps {
  saveCredential: (credential: Credential) => void;
}

export default function IssueCredential({ saveCredential }: IssueCredentialProps) {
  const account = useActiveAccount();
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<string>('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [issuanceStatus, setIssuanceStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [credentialHash, setCredentialHash] = useState<string | null>(null);
  const [customFields, setCustomFields] = useState<{key: string, value: string}[]>([
    { key: '', value: '' }
  ]);
  const [expiryDate, setExpiryDate] = useState<string>('');

  // Load students when component mounts
  useEffect(() => {
    if (account?.address) {
      loadStudents();
    }
  }, [account]);

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

  const addCustomField = () => {
    setCustomFields([...customFields, { key: '', value: '' }]);
  };

  const updateCustomField = (index: number, field: 'key' | 'value', value: string) => {
    const updatedFields = [...customFields];
    updatedFields[index][field] = value;
    setCustomFields(updatedFields);
  };

  const removeCustomField = (index: number) => {
    const updatedFields = [...customFields];
    updatedFields.splice(index, 1);
    setCustomFields(updatedFields);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedStudent || !title || !description) {
      alert("Please fill in all required fields");
      return;
    }

    if (!account?.address) {
      alert("Please connect your wallet to issue credentials");
      return;
    }

    setIssuanceStatus('processing');

    try {
      // Find selected student details
      const student = students.find(s => s.id === selectedStudent);
      if (!student) {
        throw new Error("Selected student not found");
      }

      // Validate wallet address format
      if (!/^0x[a-fA-F0-9]{40}$/.test(student.walletAddress)) {
        throw new Error("Invalid student wallet address format");
      }

      // Validate institution wallet
      if (!/^0x[a-fA-F0-9]{40}$/.test(account.address)) {
        throw new Error("Invalid institution wallet address format");
      }

      // Create metadata from custom fields
      const metadata: Record<string, any> = {};
      customFields.forEach(field => {
        if (field.key && field.value) {
          metadata[field.key] = field.value;
        }
      });

      // Validate expiry date if provided
      let expiry: number | undefined;
      if (expiryDate) {
        const expiryTimestamp = new Date(expiryDate).getTime();
        if (isNaN(expiryTimestamp)) {
          throw new Error("Invalid expiry date format");
        }
        if (expiryTimestamp <= Date.now()) {
          throw new Error("Expiry date must be in the future");
        }
        expiry = expiryTimestamp;
      }

      // Create credential object
      const newCredential: Credential = {
        id: `cred_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        title,
        description,
        studentName: student.name,
        studentWallet: student.walletAddress.toLowerCase(), // Normalize wallet address
        issuerName: localStorage.getItem(`institutionName_${account.address.toLowerCase()}`) || "Educational Institution",
        issuerWallet: account.address.toLowerCase(), // Normalize wallet address
        issueDate: Date.now(),
        expiryDate: expiry,
        metadata: Object.keys(metadata).length > 0 ? metadata : undefined
      };

      // Issue the credential
      const result = await issueCredential(newCredential, account.address);
      
      if (result.success) {
        setCredentialHash(result.hash || null);
        // Save credential via prop callback
        saveCredential(newCredential);
        setIssuanceStatus('success');

        // Reset form after success
        setTimeout(() => {
          setTitle('');
          setDescription('');
          setSelectedStudent('');
          setExpiryDate('');
          setCustomFields([{ key: '', value: '' }]);
          setIssuanceStatus('idle');
          setCredentialHash(null);
        }, 3000);
      } else {
        throw new Error(result.error || 'Unknown error issuing credential');
      }
    } catch (error) {
      console.error("Error issuing credential:", error);
      setIssuanceStatus('error');
      alert(error instanceof Error ? error.message : "Failed to issue credential. Please try again.");
    }
  };

  if (issuanceStatus === 'success') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-green-900/20 border border-green-500/30 rounded-2xl p-8 mb-8"
      >
        <div className="flex flex-col items-center justify-center py-8">
          <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-4">
            <DocumentCheckIcon className="w-8 h-8 text-green-500" />
          </div>
          <h3 className="text-2xl font-semibold text-green-400 mb-4">Credential Issued Successfully!</h3>
          <p className="text-gray-300 text-center mb-6">
            The credential has been issued to {students.find(s => s.id === selectedStudent)?.name}.
          </p>
          {credentialHash && (
            <div className="mb-6 bg-black/30 rounded-lg p-4 w-full max-w-md">
              <p className="text-gray-400 text-sm mb-1">IPFS Hash:</p>
              <p className="text-blue-400 text-sm break-all">{credentialHash}</p>
              <a
                href={`https://gateway.pinata.cloud/ipfs/${credentialHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-purple-400 hover:text-purple-300 mt-2 block"
              >
                View on IPFS
              </a>
            </div>
          )}
        </div>
      </motion.div>
    );
  }

  if (issuanceStatus === 'error') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-red-900/20 border border-red-500/30 rounded-2xl p-8 mb-8"
      >
        <div className="flex flex-col items-center justify-center py-8">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-4">
            <div className="w-8 h-8 text-red-500">❌</div>
          </div>
          <h3 className="text-2xl font-semibold text-red-400 mb-4">Failed to Issue Credential</h3>
          <p className="text-gray-300 text-center mb-6">
            There was an error issuing the credential. Please try again.
          </p>
          <button
            onClick={() => setIssuanceStatus('idle')}
            className="px-6 py-2 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 hover:bg-red-500/20"
          >
            Try Again
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-black/40 border border-blue-500/20 rounded-2xl p-8 mb-8"
    >
      <div className="flex items-center mb-6">
        <DocumentCheckIcon className="w-8 h-8 text-blue-500 mr-3" />
        <h2 className="text-2xl font-semibold text-blue-300">Issue New Credential</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Student Selection */}
        <div>
          <label className="block text-gray-300 mb-2">Select Student</label>
          <select
            value={selectedStudent}
            onChange={(e) => setSelectedStudent(e.target.value)}
            className="w-full bg-black/50 border-2 border-blue-500/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500/40 transition-all duration-300"
            required
          >
            <option value="">-- Select Student --</option>
            {students.map(student => (
              <option key={student.id} value={student.id}>
                {student.name} - {student.walletAddress.substring(0, 8)}...{student.walletAddress.substring(student.walletAddress.length - 6)}
              </option>
            ))}
          </select>
          {students.length === 0 && (
            <p className="mt-2 text-yellow-400 text-sm">
              No students available. Please add students first.
            </p>
          )}
          {selectedStudent && (
            <div className="mt-2 p-2 bg-blue-500/10 border border-blue-500/20 rounded-md">
              <p className="text-sm text-gray-300">
                <span className="font-semibold">Selected student:</span> {students.find(s => s.id === selectedStudent)?.name}
              </p>
              <p className="text-xs text-blue-300 font-mono break-all mt-1">
                Wallet: {students.find(s => s.id === selectedStudent)?.walletAddress}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                This wallet address must match the student's connected wallet in order for them to see these credentials
              </p>
            </div>
          )}
        </div>

        {/* Credential Title */}
        <div>
          <label className="block text-gray-300 mb-2">Credential Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Bachelor of Computer Science"
            className="w-full bg-black/50 border-2 border-blue-500/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500/40 transition-all duration-300"
            required
          />
        </div>

        {/* Credential Description */}
        <div>
          <label className="block text-gray-300 mb-2">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Detailed description of the credential"
            rows={4}
            className="w-full bg-black/50 border-2 border-blue-500/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500/40 transition-all duration-300"
            required
          />
        </div>

        {/* Expiry Date (Optional) */}
        <div>
          <label className="block text-gray-300 mb-2">Expiry Date (Optional)</label>
          <input
            type="date"
            value={expiryDate}
            onChange={(e) => setExpiryDate(e.target.value)}
            className="w-full bg-black/50 border-2 border-blue-500/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500/40 transition-all duration-300"
          />
        </div>

        {/* Custom Metadata Fields */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="block text-gray-300">Additional Metadata (Optional)</label>
            <button
              type="button"
              onClick={addCustomField}
              className="text-blue-400 hover:text-blue-300 text-sm"
            >
              + Add Field
            </button>
          </div>
          
          {customFields.map((field, index) => (
            <div key={index} className="flex gap-2 mb-2">
              <input
                type="text"
                value={field.key}
                onChange={(e) => updateCustomField(index, 'key', e.target.value)}
                placeholder="Field name"
                className="w-1/3 bg-black/50 border-2 border-blue-500/20 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-blue-500/40 transition-all duration-300"
              />
              <input
                type="text"
                value={field.value}
                onChange={(e) => updateCustomField(index, 'value', e.target.value)}
                placeholder="Value"
                className="w-2/3 bg-black/50 border-2 border-blue-500/20 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-blue-500/40 transition-all duration-300"
              />
              {index > 0 && (
                <button
                  type="button"
                  onClick={() => removeCustomField(index)}
                  className="text-red-400 hover:text-red-300 px-2"
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={issuanceStatus === 'processing'}
          className={`w-full py-4 rounded-xl font-medium transition-all duration-300 ${
            issuanceStatus === 'processing'
              ? "bg-gray-500/10 border-2 border-gray-500/20 text-gray-400 cursor-not-allowed"
              : "bg-blue-500/10 border-2 border-blue-500/20 hover:bg-blue-500/20 text-blue-400 hover:text-blue-300"
          }`}
        >
          {issuanceStatus === 'processing' ? (
            <div className="flex items-center justify-center">
              <div className="w-5 h-5 border-2 border-gray-400 border-t-blue-400 rounded-full animate-spin mr-2"></div>
              Processing...
            </div>
          ) : (
            "Issue Credential"
          )}
        </button>
      </form>
    </motion.div>
  );
} 