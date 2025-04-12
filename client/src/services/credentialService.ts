import { 
  mockStoreTransactionData, 
  mockRetrieveTransactionData, 
  mockGetStudents,
  mockGetCredentials,
  mockVerifyCredential,
  mockGetUserRole
} from './mockService';
import { v4 as uuidv4 } from 'uuid';

export interface Credential {
  id: string;
  title: string;
  description: string;
  studentName: string;
  studentWallet: string;
  issuerName: string;
  issuerWallet: string;
  issueDate: number;
  expiryDate?: number;
  metadata?: Record<string, any>;
}

export interface Student {
  id: string;
  walletAddress: string;
  name: string;
  email: string;
  registrationDate: number;
  department: string;
  credentialsCount: number;
  status: string;
}

export interface VerificationResult {
  isValid: boolean;
  credential?: Credential;
  message: string;
}

/**
 * Issue a new credential to a student
 */
export const issueCredential = async (
  credential: Credential, 
  institutionAddress: string
): Promise<{ success: boolean; hash?: string; error?: string }> => {
  try {
    // Ensure metadata fields are included
    const credentialWithMetadata = {
      ...credential,
      metadata: {
        ...credential.metadata,
        specialization: credential.metadata?.specialization || '',
        projects: credential.metadata?.projects || [],
        duration: credential.metadata?.duration || '',
        grade: credential.metadata?.grade || '',
        completionStatus: credential.metadata?.completionStatus || 'Completed'
      }
    };

    // Store credential using mock IPFS
    const hash = await mockStoreTransactionData({
      address: institutionAddress,
      role: 'institution',
      timestamp: Date.now(),
      transactionHash: `credential_${credentialWithMetadata.id}`,
      additionalData: { credential: credentialWithMetadata },
      paymentConfirmed: true,
      status: 'approved'
    });

    // Save credential to local storage
    saveCredentialToLocalStorage(credentialWithMetadata, institutionAddress);

    return { success: true, hash };
  } catch (error) {
    console.error('Error issuing credential:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
};

/**
 * Save a credential to localStorage
 */
export const saveCredentialToLocalStorage = (
  credential: Credential, 
  institutionAddress: string
): void => {
  try {
    // Save to institution's credentials
    const institutionKey = `credentials_${institutionAddress.toLowerCase()}`;
    const existingInstitutionCredentials = localStorage.getItem(institutionKey);
    const institutionCredentials = existingInstitutionCredentials 
      ? JSON.parse(existingInstitutionCredentials) 
      : [];
    
    institutionCredentials.push(credential);
    localStorage.setItem(institutionKey, JSON.stringify(institutionCredentials));
    
    // Also save to student's credentials for easier lookup
    const studentKey = `student_credentials_${credential.studentWallet.toLowerCase()}`;
    const existingStudentCredentials = localStorage.getItem(studentKey);
    const studentCredentials = existingStudentCredentials
      ? JSON.parse(existingStudentCredentials)
      : [];
      
    studentCredentials.push(credential);
    localStorage.setItem(studentKey, JSON.stringify(studentCredentials));
  } catch (error) {
    console.error('Error saving credential to localStorage:', error);
  }
};

/**
 * Verify a credential by ID
 */
export async function verifyCredential(credentialId: string, verifierAddress: string): Promise<VerificationResult> {
  try {
    const isValid = mockVerifyCredential(credentialId);
    const credential = mockGetCredentials().find((c: Credential) => c.id === credentialId);

    if (!credential) {
      return {
        isValid: false,
        message: 'Credential not found'
      };
    }

    if (!isValid) {
      return {
        isValid: false,
        message: 'Credential verification failed',
        credential
      };
    }

    // Record verification in student's history
    const studentHistory = localStorage.getItem(`verification_history_${credential.studentWallet.toLowerCase()}`);
    const history = studentHistory ? JSON.parse(studentHistory) : [];
    
    const verificationRecord = {
      id: `verify_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      credentialId: credential.id,
      credentialTitle: credential.title,
      verifierName: 'Demo Verifier',
      verifierAddress: verifierAddress.toLowerCase(),
      timestamp: Date.now(),
      status: 'valid'
    };
    
    history.push(verificationRecord);
    localStorage.setItem(
      `verification_history_${credential.studentWallet.toLowerCase()}`,
      JSON.stringify(history)
    );

    // Also record in verifier's history
    const verifierHistory = localStorage.getItem(`verifier_history_${verifierAddress.toLowerCase()}`);
    const verifierRecords = verifierHistory ? JSON.parse(verifierHistory) : [];
    verifierRecords.push(verificationRecord);
    localStorage.setItem(
      `verifier_history_${verifierAddress.toLowerCase()}`,
      JSON.stringify(verifierRecords)
    );

    return {
      isValid: true,
      credential,
      message: 'Credential verified successfully'
    };
  } catch (error) {
    console.error('Error verifying credential:', error);
    return {
      isValid: false,
      message: error instanceof Error ? error.message : 'Failed to verify credential'
    };
  }
}

/**
 * Get all credentials for a student by wallet address
 */
export const getStudentCredentials = (studentWallet: string): Credential[] => {
  return mockGetCredentials().filter(
    (cred: Credential) => cred.studentWallet.toLowerCase() === studentWallet.toLowerCase()
  );
};

/**
 * Add a new credential for a student
 */
export function addCredential(credential: Credential): boolean {
  try {
    if (!credential.studentWallet) return false;
    
    // Ensure credential has required fields
    if (!credential.id) {
      credential.id = uuidv4();
    }
    
    // Save to both student and institution stores
    const studentKey = `student_credentials_${credential.studentWallet.toLowerCase()}`;
    const institutionKey = `credentials_${credential.issuerWallet.toLowerCase()}`;
    
    // Get existing student credentials
    const storedStudentCreds = localStorage.getItem(studentKey);
    const studentCredentials = storedStudentCreds ? JSON.parse(storedStudentCreds) : [];
    
    // Get existing institution credentials
    const storedInstitutionCreds = localStorage.getItem(institutionKey);
    const institutionCredentials = storedInstitutionCreds ? JSON.parse(storedInstitutionCreds) : [];
    
    // Add new credential to both
    studentCredentials.push(credential);
    institutionCredentials.push(credential);
    
    // Save back to localStorage
    localStorage.setItem(studentKey, JSON.stringify(studentCredentials));
    localStorage.setItem(institutionKey, JSON.stringify(institutionCredentials));
    
    return true;
  } catch (error) {
    console.error("Error adding credential:", error);
    return false;
  }
}

/**
 * Get credentials issued by an institution
 */
export const getInstitutionCredentials = (institutionWallet: string): Credential[] => {
  return mockGetCredentials().filter(
    (cred: Credential) => cred.issuerWallet.toLowerCase() === institutionWallet.toLowerCase()
  );
};

/**
 * Helper function to generate sample credentials for development/testing
 */
function generateSampleCredentials(studentWallet: string): Credential[] {
  const now = Date.now();
  const oneYear = 365 * 24 * 60 * 60 * 1000;
  
  // Use the first part of the wallet address to create a username
  const shortAddress = studentWallet.slice(0, 6);
  const studentName = `Student ${shortAddress}`;
  
  return [
    {
      id: uuidv4(),
      title: "Bachelor of Computer Science",
      description: "Awarded for completion of the four-year Computer Science program with specialization in Artificial Intelligence",
      studentName: studentName,
      studentWallet: studentWallet,
      issuerName: "University of Technology",
      issuerWallet: "0x123456789abcdef123456789abcdef123456789a",
      issueDate: now - (30 * 24 * 60 * 60 * 1000), // 30 days ago
      metadata: {
        gpa: "3.8",
        honors: "Cum Laude",
        graduationYear: "2023",
        department: "School of Computing",
        ipfsHash: "QmXjkFQjnD8i8f91u9XTE7Ux8rcDQgK9nc9J6pGJxrmvdj"
      }
    },
    {
      id: uuidv4(),
      title: "Blockchain Developer Certification",
      description: "Professional certification for blockchain application development using Ethereum and Solidity",
      studentName: studentName,
      studentWallet: studentWallet,
      issuerName: "Blockchain Academy",
      issuerWallet: "0xabcdef123456789abcdef123456789abcdef1234",
      issueDate: now - (60 * 24 * 60 * 60 * 1000), // 60 days ago
      expiryDate: now + oneYear,
      metadata: {
        score: "95%",
        level: "Advanced",
        skills: "Solidity, Smart Contracts, Web3.js",
        ipfsHash: "QmZjkFQjnD8i8f91u9XTE7Ux8rcDQgK9nc9J6pGJxrmvdj"
      }
    },
    {
      id: uuidv4(),
      title: "Data Science Fundamentals",
      description: "Introduction to data science concepts, statistical analysis, and machine learning algorithms",
      studentName: studentName,
      studentWallet: studentWallet,
      issuerName: "Data Institute",
      issuerWallet: "0x567890abcdef123456789abcdef123456789abcd",
      issueDate: now - (90 * 24 * 60 * 60 * 1000), // 90 days ago
      metadata: {
        completionDate: "March 15, 2023",
        courseDuration: "12 weeks",
        finalProject: "Predictive Analytics for Healthcare"
      }
    }
  ];
}

export const getStudents = async (): Promise<Student[]> => {
  return mockGetStudents();
};

export { mockGetCredentials } from './mockService'; 