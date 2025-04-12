import { Credential, Student } from './credentialService';
import { UserRole } from '../types';

interface VerificationHistory {
  id: string;
  credentialId: string;
  credentialTitle: string;
  studentName: string;
  studentWallet: string;
  timestamp: number;
  status: 'valid' | 'invalid';
}

// Mock student data
export const mockStudents: Student[] = [
  {
    id: '1',
    walletAddress: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
    name: 'John Doe',
    email: 'john.doe@example.com',
    registrationDate: Date.now() - (365 * 24 * 60 * 60 * 1000), // 1 year ago
    department: 'Computer Science',
    credentialsCount: 3,
    status: 'active'
  },
  {
    id: '2',
    walletAddress: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
    name: 'Alice Johnson',
    email: 'alice@example.com',
    registrationDate: Date.now() - (300 * 24 * 60 * 60 * 1000), // 10 months ago
    department: 'Computer Science',
    credentialsCount: 2,
    status: 'active'
  },
  {
    id: '3',
    walletAddress: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
    name: 'Bob Smith',
    email: 'bob@example.com',
    registrationDate: Date.now() - (250 * 24 * 60 * 60 * 1000), // 8 months ago
    department: 'Blockchain Technology',
    credentialsCount: 1,
    status: 'active'
  },
  {
    id: '4',
    walletAddress: '0x90F79bf6EB2c4f870365E785982E1f101E93b906',
    name: 'Emma Wilson',
    email: 'emma@example.com',
    registrationDate: Date.now() - (200 * 24 * 60 * 60 * 1000), // 6 months ago
    department: 'Artificial Intelligence',
    credentialsCount: 2,
    status: 'active'
  }
];

// Mock credentials for the students
export const mockCredentials: Credential[] = [
  {
    id: 'cred1',
    title: 'Machine Learning Specialization',
    description: 'Advanced certification in machine learning and artificial intelligence',
    studentName: 'John Doe',
    studentWallet: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
    issuerName: 'Tech University',
    issuerWallet: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
    issueDate: Date.now() - (30 * 24 * 60 * 60 * 1000), // 1 month ago
    metadata: {
      specialization: 'Deep Learning',
      projects: ['Image Classification', 'Natural Language Processing'],
      duration: '6 months',
      grade: 'A',
      completionStatus: 'Completed'
    }
  },
  {
    id: 'cred2',
    title: 'Dept of CSE',
    description: 'AIML',
    studentName: 'Likith',
    studentWallet: '0xbDA5747bFD65F08deb54cb465eB87D40e51B197E',
    issuerName: 'MVJ College of Engineering ',
    issuerWallet: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
    issueDate: Date.now() - (45 * 24 * 60 * 60 * 1000), // 1.5 months ago
    metadata: {
      grade: 'A+',
      completionStatus: 'Completed'
    }
  },
  {
    id: 'cred3',
    title: 'Bachelor of Science in Computer Science',
    description: 'Awarded for completion of the Computer Science program with honors',
    studentName: 'John Doe',
    studentWallet: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
    issuerName: 'Tech University',
    issuerWallet: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
    issueDate: Date.now() - (60 * 24 * 60 * 60 * 1000), // 2 months ago
    metadata: {
      gpa: '3.8',
      graduationYear: '2024',
      major: 'Computer Science',
      honors: 'Cum Laude',
      duration: '4 years',
      completionStatus: 'Completed'
    }
  },
  {
    id: 'cred4',
    title: 'Advanced AI and Deep Learning',
    description: 'Specialized certification in advanced AI techniques and deep learning architectures',
    studentName: 'Emma Wilson',
    studentWallet: '0x90F79bf6EB2c4f870365E785982E1f101E93b906',
    issuerName: 'Tech University',
    issuerWallet: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
    issueDate: Date.now() - (15 * 24 * 60 * 60 * 1000), // 15 days ago
    metadata: {
      specialization: 'Neural Networks',
      projects: ['Deep Learning Models', 'Computer Vision'],
      duration: '8 months',
      grade: 'A+',
      completionStatus: 'Completed'
    }
  },
  {
    id: 'cred5',
    title: 'Web3 Development Fundamentals',
    description: 'Comprehensive course on Web3 development and decentralized applications',
    studentName: 'Bob Smith',
    studentWallet: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
    issuerName: 'Tech University',
    issuerWallet: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
    issueDate: Date.now() - (7 * 24 * 60 * 60 * 1000), // 7 days ago
    metadata: {
      specialization: 'DApp Development',
      projects: ['DeFi Application', 'NFT Marketplace'],
      duration: '4 months',
      grade: 'B+',
      completionStatus: 'Completed'
    }
  }
];

// Analytics data
export const mockAnalytics = {
  totalStudents: mockStudents.length,
  totalCredentials: mockCredentials.length,
  departmentDistribution: {
    'Computer Science': 2,
    'Blockchain Technology': 1,
    'Artificial Intelligence': 1
  },
  credentialsByMonth: {
    'March 2024': 2,
    'February 2024': 2,
    'January 2024': 1
  },
  completionRates: {
    'Completed': 5,
    'In Progress': 0,
    'Not Started': 0
  }
};

// Mock IPFS data
const mockIpfsData: Record<string, any> = {
  'mock_ipfs_hash_1': {
    additionalData: {
      credential: mockCredentials[0],
      verification: {
        timestamp: Date.now(),
        verifiedBy: '0x3333333333333333333333333333333333333333'
      }
    }
  },
  'mock_ipfs_hash_2': {
    additionalData: {
      credential: mockCredentials[1],
      verification: {
        timestamp: Date.now(),
        verifiedBy: '0x4444444444444444444444444444444444444444'
      }
    }
  }
};

// Mock verification history
const mockVerificationHistory: Record<string, any[]> = {
  '0x3333333333333333333333333333333333333333': [
    {
      id: 'verify1',
      credentialId: 'cred1',
      credentialTitle: 'Machine Learning Specialization',
      studentName: 'John Doe',
      studentWallet: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
      timestamp: Date.now() - 100000,
      status: 'valid'
    }
  ],
  '0x4444444444444444444444444444444444444444': [
    {
      id: 'verify2',
      credentialId: 'cred2',
      credentialTitle: 'Blockchain Developer Certification',
      studentName: 'John Doe',
      studentWallet: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
      timestamp: Date.now() - 50000,
      status: 'valid'
    }
  ]
};

// Mock functions
export const mockStoreTransactionData = async (data: any): Promise<string> => {
  const mockHash = `mock_ipfs_hash_${Date.now()}`;
  mockIpfsData[mockHash] = data;
  return mockHash;
};

export const mockRetrieveTransactionData = async (hash: string): Promise<any> => {
  return mockIpfsData[hash] || null;
};

export const mockGetStudents = (): Student[] => {
  return mockStudents;
};

export const mockGetCredentials = (): Credential[] => {
  return mockCredentials;
};

export const mockVerifyCredential = (credentialId: string): boolean => {
  // Check if the credential exists in our mock data
  const credential = mockCredentials.find(cred => cred.id === credentialId);
  if (!credential) {
    console.error('Credential not found:', credentialId);
    return false;
  }

  // For mock purposes, we'll consider all credentials valid
  // In a real implementation, this would check blockchain signatures, etc.
  console.log('Verifying credential:', credential);
  return true;
};

export const mockGetVerificationHistory = (verifierAddress: string): VerificationHistory[] => {
  // Mock verification history data
  const mockHistory: VerificationHistory[] = [
    {
      id: '1',
      credentialId: 'cred1',
      credentialTitle: 'Machine Learning Specialization',
      studentName: 'John Doe',
      studentWallet: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
      timestamp: Date.now() - 86400000, // 1 day ago
      status: 'valid'
    },
    {
      id: '2',
      credentialId: 'cred2',
      credentialTitle: 'Blockchain Developer Certification',
      studentName: 'John Doe',
      studentWallet: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
      timestamp: Date.now() - 172800000, // 2 days ago
      status: 'valid'
    }
  ];

  return mockHistory;
};

// Mock wallet connection
export const mockConnectWallet = async (): Promise<string> => {
  return '0x1234567890123456789012345678901234567890';
};

// Mock role check
export const mockGetUserRole = (walletAddress: string): UserRole => {
  const roles: Record<string, UserRole> = {
    '0x1234567890123456789012345678901234567890': 'admin',
    '0x0987654321098765432109876543210987654321': 'institution',
    '0x14dC79964da2C08b23698B3D3cc7Ca32193d9955': 'verifier',
    '0x2222222222222222222222222222222222222222': 'student',
  };
  return roles[walletAddress.toLowerCase()] || 'student';
}; 