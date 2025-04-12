import React, { useState } from 'react';
import { UserRole } from '../types';
import { AcademicCapIcon, BuildingOfficeIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';
import { providers, utils } from 'ethers';

interface RoleSelectionModalProps {
  onSelect: (role: UserRole) => void;
  onClose: () => void;
}

const RoleSelectionModal: React.FC<RoleSelectionModalProps> = ({ onSelect, onClose }) => {
  const [isPaying, setIsPaying] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleRoleSelect = async (role: UserRole) => {
    setSelectedRole(role);
    setIsPaying(true);
    setError(null);
  };

  const handlePayment = async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (!window.ethereum) {
        throw new Error('Please install MetaMask to make the payment');
      }

      // Request account access
      const provider = new providers.Web3Provider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      const signer = provider.getSigner();
      const address = await signer.getAddress();

      // Get network information
      const network = await provider.getNetwork();
      // Allow both localhost (1337) and hardhat (31337) networks
      if (network.chainId !== 1337 && network.chainId !== 31337) {
        throw new Error('Please switch to localhost network');
      }

      // Payment amount (0.01 ETH)
      const amount = utils.parseEther("0.01");

      // Check if user has enough balance
      const balance = await provider.getBalance(address);
      if (balance.lt(amount)) {
        throw new Error('Insufficient balance. Please ensure you have enough ETH');
      }

      // Send real transaction to MetaMask
      const tx = await signer.sendTransaction({
        to: address, // Sending to self for testing
        value: amount,
        data: "0x" // Empty data field
      });

      // Wait for transaction to be mined
      await tx.wait();
      
      // After successful payment, proceed with role selection
      onSelect(selectedRole!);
    } catch (error) {
      console.error('Payment failed:', error);
      setError(error instanceof Error ? error.message : 'Payment failed. Please try again.');
      setIsPaying(false);
    } finally {
      setIsLoading(false);
    }
  };

  if (isPaying) {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-black border border-purple-500/20 rounded-2xl p-8 max-w-md w-full">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-semibold text-purple-300">Complete Payment</h2>
            <button
              onClick={() => setIsPaying(false)}
              className="text-gray-400 hover:text-white transition-colors duration-300"
            >
              ×
            </button>
          </div>
          <div className="space-y-6">
            <div className="text-center">
              <p className="text-gray-300 mb-4">
                Please approve the transaction in MetaMask to complete your {selectedRole} registration.
              </p>
              <p className="text-purple-300 mb-6">
                Amount: 0.01 ETH
              </p>
              {error && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-300">
                  {error}
                </div>
              )}
              <button
                onClick={handlePayment}
                disabled={isLoading}
                className={`w-full px-6 py-5 rounded-xl bg-purple-500/10 text-purple-300 border-2 border-purple-500/20 hover:bg-purple-500/20 hover:border-purple-500/40 transition-all duration-300 flex items-center justify-center space-x-4 text-lg ${
                  isLoading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-5 h-5 border-2 border-purple-300 border-t-transparent rounded-full animate-spin"></div>
                    <span>Processing...</span>
                  </div>
                ) : (
                  'Pay with MetaMask'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-black border border-purple-500/20 rounded-2xl p-8 max-w-md w-full">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-semibold text-purple-300">Select Your Role</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors duration-300"
          >
            ×
          </button>
        </div>
        <div className="space-y-6">
          <button
            onClick={() => handleRoleSelect('student')}
            className="w-full px-6 py-5 rounded-xl bg-purple-500/10 text-purple-300 border-2 border-purple-500/20 hover:bg-purple-500/20 hover:border-purple-500/40 transition-all duration-300 flex items-center justify-center space-x-4 text-lg"
          >
            <AcademicCapIcon className="w-7 h-7" />
            <span>Student</span>
          </button>
          <button
            onClick={() => handleRoleSelect('institution')}
            className="w-full px-6 py-5 rounded-xl bg-purple-500/10 text-purple-300 border-2 border-purple-500/20 hover:bg-purple-500/20 hover:border-purple-500/40 transition-all duration-300 flex items-center justify-center space-x-4 text-lg"
          >
            <BuildingOfficeIcon className="w-7 h-7" />
            <span>Institution</span>
          </button>
          <button
            onClick={() => handleRoleSelect('verifier')}
            className="w-full px-6 py-5 rounded-xl bg-purple-500/10 text-purple-300 border-2 border-purple-500/20 hover:bg-purple-500/20 hover:border-purple-500/40 transition-all duration-300 flex items-center justify-center space-x-4 text-lg"
          >
            <ShieldCheckIcon className="w-7 h-7" />
            <span>Verifier</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default RoleSelectionModal; 