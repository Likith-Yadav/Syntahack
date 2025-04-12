import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  AcademicCapIcon, 
  ShieldCheckIcon, 
  DocumentCheckIcon,
  UserGroupIcon,
  ChartBarIcon,
  ClockIcon,
  BuildingOfficeIcon,
  IdentificationIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { mockStudents, mockCredentials, mockAnalytics } from '../services/mockService';

const LandingPage = () => {
  const stats = [
    { name: 'Verification Time Reduction', value: '89%', icon: ClockIcon },
    { name: 'Cost Reduction', value: '82%', icon: ChartBarIcon },
    { name: 'Total Students', value: mockAnalytics.totalStudents, icon: UserGroupIcon },
    { name: 'Total Credentials', value: mockAnalytics.totalCredentials, icon: DocumentCheckIcon }
  ];

  const departments = Object.entries(mockAnalytics.departmentDistribution).map(([name, count]) => ({
    name,
    count
  }));

  const recentCredentials = mockCredentials
    .sort((a, b) => b.issueDate - a.issueDate)
    .slice(0, 3);

  return (
    <div className="min-h-screen bg-gradient-to-b from-black to-purple-900/20">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="relative z-10 pb-8 sm:pb-16 md:pb-20 lg:max-w-2xl lg:w-full lg:pb-28 xl:pb-32">
            <main className="mt-10 mx-auto max-w-7xl px-4 sm:mt-12 sm:px-6 md:mt-16 lg:mt-20 lg:px-8 xl:mt-28">
              <div className="sm:text-center lg:text-left">
                <h1 className="text-4xl tracking-tight font-extrabold text-white sm:text-5xl md:text-6xl">
                  <span className="block">EduChain</span>
                  <span className="block text-purple-400">Blockchain-Powered Academic Credentials</span>
                </h1>
                <p className="mt-3 text-base text-gray-300 sm:mt-5 sm:text-lg sm:max-w-xl sm:mx-auto md:mt-5 md:text-xl lg:mx-0">
                  A revolutionary blockchain-based academic credential verification system that transforms how educational institutions issue, manage, and verify academic credentials.
                </p>
                <div className="mt-5 sm:mt-8 sm:flex sm:justify-center lg:justify-start">
                  <div className="rounded-md shadow">
                    <Link
                      to="/student"
                      className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 md:py-4 md:text-lg md:px-10"
                    >
                      Get Started
                    </Link>
                  </div>
                  <div className="mt-3 sm:mt-0 sm:ml-3">
                    <Link
                      to="/verify"
                      className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-purple-700 bg-purple-100 hover:bg-purple-200 md:py-4 md:text-lg md:px-10"
                    >
                      Verify Credentials
                    </Link>
                  </div>
                </div>
              </div>
            </main>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="bg-black/40 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => (
              <motion.div
                key={stat.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="bg-black/40 border border-purple-500/20 rounded-xl p-6"
              >
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <stat.icon className="h-8 w-8 text-purple-400" aria-hidden="true" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-400 truncate">{stat.name}</dt>
                      <dd className="text-2xl font-semibold text-white">{stat.value}</dd>
                    </dl>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-12 bg-black/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:text-center">
            <h2 className="text-base text-purple-400 font-semibold tracking-wide uppercase">Key Features</h2>
            <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-white sm:text-4xl">
              Our Platform Solutions
            </p>
          </div>

          <div className="mt-10">
            <div className="space-y-10 md:space-y-0 md:grid md:grid-cols-3 md:gap-x-8 md:gap-y-10">
              <div className="relative">
                <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-purple-500 text-white">
                  <BuildingOfficeIcon className="h-6 w-6" aria-hidden="true" />
                </div>
                <p className="ml-16 text-lg leading-6 font-medium text-white">Publisher Tool</p>
                <p className="mt-2 ml-16 text-base text-gray-400">
                  Educational institutions can easily issue and manage credentials through our intuitive interface.
                </p>
              </div>

              <div className="relative">
                <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-purple-500 text-white">
                  <IdentificationIcon className="h-6 w-6" aria-hidden="true" />
                </div>
                <p className="ml-16 text-lg leading-6 font-medium text-white">Academic Passport</p>
                <p className="mt-2 ml-16 text-base text-gray-400">
                  Students maintain a secure, portable digital wallet of their academic achievements.
                </p>
              </div>

              <div className="relative">
                <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-purple-500 text-white">
                  <CheckCircleIcon className="h-6 w-6" aria-hidden="true" />
                </div>
                <p className="ml-16 text-lg leading-6 font-medium text-white">Verification Portal</p>
                <p className="mt-2 ml-16 text-base text-gray-400">
                  Employers and institutions can instantly verify credentials with our blockchain-powered system.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Credentials Section */}
      <div className="py-12 bg-black/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:text-center mb-8">
            <h2 className="text-base text-purple-400 font-semibold tracking-wide uppercase">Recent Credentials</h2>
            <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-white sm:text-4xl">
              Latest Issued Credentials
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {recentCredentials.map((credential) => (
              <motion.div
                key={credential.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="bg-black/40 border border-purple-500/20 rounded-xl p-6"
              >
                <h3 className="text-lg font-medium text-white">{credential.title}</h3>
                <p className="mt-2 text-sm text-gray-400">{credential.description}</p>
                <div className="mt-4">
                  <p className="text-sm text-gray-400">Issued to: {credential.studentName}</p>
                  <p className="text-sm text-gray-400">Date: {new Date(credential.issueDate).toLocaleDateString()}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Department Distribution Section */}
      <div className="py-12 bg-black/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:text-center mb-8">
            <h2 className="text-base text-purple-400 font-semibold tracking-wide uppercase">Department Distribution</h2>
            <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-white sm:text-4xl">
              Student Distribution Across Departments
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {departments.map((department) => (
              <motion.div
                key={department.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="bg-black/40 border border-purple-500/20 rounded-xl p-6"
              >
                <h3 className="text-lg font-medium text-white">{department.name}</h3>
                <p className="mt-2 text-2xl font-semibold text-purple-400">{department.count} Students</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage; 