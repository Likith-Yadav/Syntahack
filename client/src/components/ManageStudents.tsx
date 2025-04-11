import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { UserGroupIcon, PlusIcon, UserIcon, XMarkIcon, PencilIcon } from '@heroicons/react/24/outline';
import { useActiveAccount } from 'thirdweb/react';
import { Student } from '../services/credentialService';

interface ManageStudentsProps {
  saveStudent: (student: Student) => void;
}

export default function ManageStudents({ saveStudent }: ManageStudentsProps) {
  const account = useActiveAccount();
  const [students, setStudents] = useState<Student[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [walletAddress, setWalletAddress] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

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

  const handleAddStudent = () => {
    if (!walletAddress || !name || !email) {
      alert("Please fill in all fields");
      return;
    }

    // Simple validation
    if (!walletAddress.startsWith('0x') || walletAddress.length !== 42) {
      alert("Please enter a valid Ethereum wallet address");
      return;
    }

    const newStudent: Student = {
      id: `stu_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      walletAddress: walletAddress.toLowerCase(),
      name,
      email,
      registrationDate: Date.now(),
    };

    // Check for duplicate wallet address
    if (students.some(s => s.walletAddress.toLowerCase() === walletAddress.toLowerCase())) {
      alert("A student with this wallet address already exists");
      return;
    }

    const updatedStudents = [...students, newStudent];
    setStudents(updatedStudents);
    localStorage.setItem(`students_${account?.address?.toLowerCase()}`, JSON.stringify(updatedStudents));
    saveStudent(newStudent);

    // Reset form
    setName('');
    setEmail('');
    setWalletAddress('');
    setShowAddModal(false);
  };

  const handleDeleteStudent = (studentId: string) => {
    if (confirm("Are you sure you want to delete this student? This action cannot be undone.")) {
      const updatedStudents = students.filter(student => student.id !== studentId);
      setStudents(updatedStudents);
      localStorage.setItem(`students_${account?.address?.toLowerCase()}`, JSON.stringify(updatedStudents));
    }
  };

  const handleViewStudent = (student: Student) => {
    setSelectedStudent(student);
  };

  // Filter students based on search query
  const filteredStudents = students.filter(student => 
    student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.walletAddress.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div>
      {/* Student Management Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-black/40 border border-blue-500/20 rounded-2xl p-8 mb-8"
      >
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center">
            <UserGroupIcon className="w-8 h-8 text-blue-500 mr-3" />
            <h2 className="text-2xl font-semibold text-blue-300">Student Management</h2>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-500/10 border border-blue-500/30 rounded-lg text-blue-400 hover:bg-blue-500/20"
          >
            <PlusIcon className="w-4 h-4" />
            <span>Add Student</span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search students by name, email, or wallet address..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-black/50 border-2 border-blue-500/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500/40 transition-all duration-300"
          />
        </div>

        {/* Students List */}
        <div className="overflow-hidden rounded-xl border border-blue-500/20">
          <table className="min-w-full divide-y divide-blue-500/20">
            <thead className="bg-blue-900/20">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-blue-300 uppercase tracking-wider">
                  Name
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-blue-300 uppercase tracking-wider">
                  Email
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-blue-300 uppercase tracking-wider">
                  Wallet Address
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-blue-300 uppercase tracking-wider">
                  Registration Date
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-blue-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-blue-500/10">
              {filteredStudents.length > 0 ? (
                filteredStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-blue-900/10">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                      {student.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {student.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      <div className="flex items-center group relative">
                        <span className="bg-blue-500/10 text-blue-400 px-2 py-1 rounded-md font-mono">
                          {student.walletAddress.substring(0, 6)}...{student.walletAddress.substring(student.walletAddress.length - 4)}
                        </span>
                        <div className="hidden group-hover:block absolute left-0 bottom-full mb-2 p-2 bg-black border border-blue-500/20 rounded-md text-xs text-white font-mono z-10 whitespace-normal break-all max-w-xs">
                          {student.walletAddress}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {new Date(student.registrationDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleViewStudent(student)}
                        className="text-blue-400 hover:text-blue-300 mx-2"
                        title="View Student"
                      >
                        <UserIcon className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteStudent(student.id)}
                        className="text-red-400 hover:text-red-300 mx-2"
                        title="Delete Student"
                      >
                        <XMarkIcon className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-gray-400">
                    {students.length === 0 
                      ? "No students have been added yet" 
                      : "No students match your search criteria"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Add Student Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-black/90 border-2 border-blue-500/30 rounded-2xl p-8 w-full max-w-md mx-4 shadow-2xl shadow-blue-500/10"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold text-blue-300">Add New Student</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-white"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-gray-300 mb-2">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full bg-black/50 border-2 border-blue-500/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500/40 transition-all duration-300"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-300 mb-2">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="john.doe@example.com"
                  className="w-full bg-black/50 border-2 border-blue-500/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500/40 transition-all duration-300"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-300 mb-2">Wallet Address</label>
                <input
                  type="text"
                  value={walletAddress}
                  onChange={(e) => setWalletAddress(e.target.value)}
                  placeholder="0x..."
                  className="w-full bg-black/50 border-2 border-blue-500/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500/40 transition-all duration-300"
                  required
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="px-6 py-3 rounded-xl bg-red-500/10 border-2 border-red-500/20 hover:bg-red-500/20 transition-all duration-300 text-red-400 hover:text-red-300 font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddStudent}
                  className="px-6 py-3 rounded-xl bg-blue-500/10 border-2 border-blue-500/20 hover:bg-blue-500/20 transition-all duration-300 text-blue-400 hover:text-blue-300 font-medium"
                >
                  Add Student
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Student Detail Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-black/90 border-2 border-blue-500/30 rounded-2xl p-8 w-full max-w-md mx-4 shadow-2xl shadow-blue-500/10"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold text-blue-300">Student Details</h2>
              <button
                onClick={() => setSelectedStudent(null)}
                className="text-gray-400 hover:text-white"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4 mb-6">
              <div className="flex justify-center mb-6">
                <div className="w-20 h-20 rounded-full bg-blue-500/20 flex items-center justify-center">
                  <UserIcon className="w-10 h-10 text-blue-400" />
                </div>
              </div>

              <div>
                <label className="block text-gray-400 text-sm">Full Name</label>
                <p className="text-white font-medium">{selectedStudent.name}</p>
              </div>

              <div>
                <label className="block text-gray-400 text-sm">Email Address</label>
                <p className="text-white">{selectedStudent.email}</p>
              </div>

              <div>
                <label className="block text-gray-400 text-sm">Wallet Address</label>
                <p className="text-white break-all">{selectedStudent.walletAddress}</p>
              </div>

              <div>
                <label className="block text-gray-400 text-sm">Registration Date</label>
                <p className="text-white">{new Date(selectedStudent.registrationDate).toLocaleString()}</p>
              </div>
            </div>

            <div className="pt-4 border-t border-blue-500/20">
              <button
                onClick={() => setSelectedStudent(null)}
                className="w-full px-6 py-3 rounded-xl bg-blue-500/10 border-2 border-blue-500/20 hover:bg-blue-500/20 transition-all duration-300 text-blue-400 hover:text-blue-300 font-medium"
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
} 