import { storeTransactionData, retrieveTransactionData } from './ipfsService';
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
}

/**
 * Issue a new credential to a student
 */
export const issueCredential = async (
  credential: Credential, 
  institutionAddress: string
): Promise<{ success: boolean; hash?: string; error?: string }> => {
  try {
    // Store credential on IPFS
    const hash = await storeTransactionData({
      address: institutionAddress,
      role: 'institution',
      timestamp: Date.now(),
      transactionHash: `credential_${credential.id}`,
      additionalData: { credential },
      paymentConfirmed: true,
      status: 'approved'
    });

    // Save credential to local storage
    saveCredentialToLocalStorage(credential, institutionAddress);

    return { success: true, hash };
  } catch (error) {
    console.error('Error issuing credential:', error);
    
    // Even if IPFS fails, we still save to localStorage as fallback
    saveCredentialToLocalStorage(credential, institutionAddress);
    
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
export const verifyCredential = async (
  credentialId: string,
  ipfsHash?: string
): Promise<{ isValid: boolean; credential?: Credential; message: string }> => {
  try {
    // If we have an IPFS hash, try to retrieve from IPFS first
    if (ipfsHash) {
      const data = await retrieveTransactionData(ipfsHash);
      if (data && data.additionalData?.credential && data.additionalData.credential.id === credentialId) {
        return { 
          isValid: true, 
          credential: data.additionalData.credential as Credential,
          message: "Credential successfully verified on IPFS."
        };
      }
    }
    
    // Fallback to local verification (in a real app, this would query the blockchain)
    // First check student-specific storage
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('student_credentials_')) {
        const credentials = JSON.parse(localStorage.getItem(key) || '[]');
        const found = credentials.find((c: Credential) => c.id === credentialId);
        if (found) {
          return { 
            isValid: true, 
            credential: found,
            message: "Credential successfully verified."
          };
        }
      }
    }
    
    // Then check institution storage
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('credentials_')) {
        const credentials = JSON.parse(localStorage.getItem(key) || '[]');
        const found = credentials.find((c: Credential) => c.id === credentialId);
        if (found) {
          return { 
            isValid: true, 
            credential: found,
            message: "Credential successfully verified."
          };
        }
      }
    }
    
    return { 
      isValid: false, 
      message: "Credential not found. It may have been revoked or does not exist."
    };
  } catch (error) {
    console.error('Error verifying credential:', error);
    return { 
      isValid: false, 
      message: error instanceof Error ? error.message : 'Unknown error verifying credential.' 
    };
  }
};

/**
 * Get all credentials for a student by wallet address
 */
export const getStudentCredentials = (studentWallet: string): Credential[] => {
  let credentials: Credential[] = [];
  
  try {
    // First check for direct student credentials
    const studentKey = `student_credentials_${studentWallet.toLowerCase()}`;
    const stored = localStorage.getItem(studentKey);
    
    if (stored) {
      credentials = JSON.parse(stored);
    } else {
      // If no direct storage, check all institution storage
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('credentials_')) {
          const institutionCredentials = JSON.parse(localStorage.getItem(key) || '[]');
          const studentCredentials = institutionCredentials.filter(
            (c: Credential) => c.studentWallet.toLowerCase() === studentWallet.toLowerCase()
          );
          credentials.push(...studentCredentials);
        }
      }
    }
    
    // If no credentials found and this is development environment, generate sample data
    if (import.meta.env.DEV && credentials.length === 0) {
      const sampleCredentials = generateSampleCredentials(studentWallet);
      localStorage.setItem(studentKey, JSON.stringify(sampleCredentials));
      credentials = sampleCredentials;
    }
  } catch (error) {
    console.error('Error fetching student credentials:', error);
  }
  
  return credentials;
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
export function getInstitutionCredentials(institutionWallet: string): Credential[] {
  try {
    // Check localStorage for institution's issued credentials
    const stored = localStorage.getItem(`credentials_${institutionWallet.toLowerCase()}`);
    if (stored) {
      return JSON.parse(stored);
    }
    return [];
  } catch (error) {
    console.error("Error getting institution credentials:", error);
    return [];
  }
}

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