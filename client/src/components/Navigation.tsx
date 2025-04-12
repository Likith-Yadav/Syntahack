import { Link } from 'react-router-dom';
import { DocumentCheckIcon } from '@heroicons/react/24/outline';
import ConnectButton from './ConnectButton';

export default function Navigation() {
  return (
    <nav className="bg-black/50 backdrop-blur-md border-b border-purple-500/20">
      <div className="container mx-auto px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-8">
            <Link to="/" className="flex items-center space-x-2">
              <DocumentCheckIcon className="w-8 h-8 text-purple-500" />
              <span className="text-xl font-bold text-white">CredentialChain</span>
            </Link>
            <div className="hidden md:flex space-x-6">
              <Link to="/" className="text-gray-300 hover:text-white transition-colors">
                Home
              </Link>
              <Link to="/institution" className="text-gray-300 hover:text-white transition-colors">
                Institution
              </Link>
              <Link to="/student" className="text-gray-300 hover:text-white transition-colors">
                Student
              </Link>
              <Link to="/verifier" className="text-gray-300 hover:text-white transition-colors">
                Verifier
              </Link>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <ConnectButton />
          </div>
        </div>
      </div>
    </nav>
  );
} 