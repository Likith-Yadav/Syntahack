export type UserRole = 'student' | 'institution' | 'admin' | 'verifier';

export interface Credential {
  id: string;
  title: string;
  description: string;
  studentName: string;
  studentWallet: string;
  issuerName: string;
  issuerWallet: string;
  issueDate: number;
  metadata: Record<string, string>;
}

export interface Student {
  id: string;
  walletAddress: string;
  name: string;
  email: string;
  registrationDate: number;
}

export interface VerificationHistory {
  id: string;
  credentialId: string;
  credentialTitle: string;
  studentName: string;
  studentWallet: string;
  timestamp: number;
  status: 'valid' | 'invalid';
} 