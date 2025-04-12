import { useState } from 'react';
import { mockConnectWallet, mockGetUserRole } from '../services/mockService';

export default function ConnectButton() {
  const [address, setAddress] = useState<string | null>(null);
  const [role, setRole] = useState<'institution' | 'student' | null>(null);

  const handleConnect = async () => {
    try {
      const walletAddress = await mockConnectWallet();
      setAddress(walletAddress);
      
      // Get user role
      const userRole = mockGetUserRole(walletAddress);
      setRole(userRole);
      
      // Store in localStorage for persistence
      localStorage.setItem('connectedWallet', walletAddress);
      if (userRole) {
        localStorage.setItem(`role_${walletAddress.toLowerCase()}`, userRole);
      }
    } catch (error) {
      console.error('Error connecting wallet:', error);
    }
  };

  return (
    <div className="flex items-center space-x-4">
      {address ? (
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-400">
            {role ? `Connected as ${role.charAt(0).toUpperCase() + role.slice(1)}` : 'Connected'}
          </span>
          <span className="text-xs text-gray-500">
            {address.slice(0, 6)}...{address.slice(-4)}
          </span>
        </div>
      ) : (
        <button
          onClick={handleConnect}
          className="px-4 py-2 bg-purple-500/10 border-2 border-purple-500/20 rounded-xl text-purple-400 hover:bg-purple-500/20 hover:text-purple-300 transition-all duration-300"
        >
          Connect Wallet
        </button>
      )}
    </div>
  );
} 