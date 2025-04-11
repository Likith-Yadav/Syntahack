import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChartBarIcon, DocumentCheckIcon, UserGroupIcon, ClockIcon } from '@heroicons/react/24/outline';
import { useActiveAccount } from 'thirdweb/react';
import { Student, Credential } from '../services/credentialService';

export default function CredentialAnalytics() {
  const account = useActiveAccount();
  const [students, setStudents] = useState<Student[]>([]);
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState({
    totalCredentials: 0,
    totalStudents: 0,
    credentialsByMonth: [] as {month: string, count: number}[],
    popularCredentials: [] as {title: string, count: number}[],
    activeStudents: [] as {name: string, credentials: number}[],
    recentActivity: [] as {date: number, action: string, details: string}[]
  });

  useEffect(() => {
    if (account?.address) {
      setIsLoading(true);
      loadData();
    }
  }, [account]);

  const loadData = async () => {
    try {
      // Load students
      const storedStudents = localStorage.getItem(`students_${account?.address?.toLowerCase()}`);
      const loadedStudents = storedStudents ? JSON.parse(storedStudents) : [];
      setStudents(loadedStudents);

      // Load credentials
      const storedCredentials = localStorage.getItem(`credentials_${account?.address?.toLowerCase()}`);
      const loadedCredentials = storedCredentials ? JSON.parse(storedCredentials) : [];
      setCredentials(loadedCredentials);

      // Calculate analytics data
      calculateAnalytics(loadedStudents, loadedCredentials);
    } catch (error) {
      console.error("Error loading analytics data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateAnalytics = (loadedStudents: Student[], loadedCredentials: Credential[]) => {
    // Calculate basic stats
    const totalCredentials = loadedCredentials.length;
    const totalStudents = loadedStudents.length;

    // Calculate credentials by month
    const credentialsGroupedByMonth: Record<string, number> = {};
    loadedCredentials.forEach(cred => {
      const date = new Date(cred.issueDate);
      const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
      
      if (!credentialsGroupedByMonth[monthKey]) {
        credentialsGroupedByMonth[monthKey] = 0;
      }
      credentialsGroupedByMonth[monthKey]++;
    });

    const credentialsByMonth = Object.entries(credentialsGroupedByMonth)
      .map(([month, count]) => {
        const [year, monthNum] = month.split('-');
        return {
          month: `${new Date(0, parseInt(monthNum) - 1).toLocaleString('default', { month: 'short' })} ${year}`,
          count
        };
      })
      .sort((a, b) => {
        const monthA = a.month.split(' ');
        const monthB = b.month.split(' ');
        return (
          parseInt(monthB[1]) - parseInt(monthA[1]) ||
          new Date(0, 0, 0, 0, 0, 0, 0).toLocaleString('default', { month: 'short' }).indexOf(monthB[0]) -
          new Date(0, 0, 0, 0, 0, 0, 0).toLocaleString('default', { month: 'short' }).indexOf(monthA[0])
        );
      });

    // Calculate popular credentials
    const credentialsByTitle: Record<string, number> = {};
    loadedCredentials.forEach(cred => {
      if (!credentialsByTitle[cred.title]) {
        credentialsByTitle[cred.title] = 0;
      }
      credentialsByTitle[cred.title]++;
    });

    const popularCredentials = Object.entries(credentialsByTitle)
      .map(([title, count]) => ({ title, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Calculate active students
    const credentialsByStudent: Record<string, number> = {};
    loadedCredentials.forEach(cred => {
      if (!credentialsByStudent[cred.studentId]) {
        credentialsByStudent[cred.studentId] = 0;
      }
      credentialsByStudent[cred.studentId]++;
    });

    const activeStudents = Object.entries(credentialsByStudent)
      .map(([studentId, credentials]) => {
        const student = loadedStudents.find(s => s.id === studentId);
        return {
          name: student ? student.name : 'Unknown Student',
          credentials
        };
      })
      .sort((a, b) => b.credentials - a.credentials)
      .slice(0, 5);

    // Recent activity
    const recentActivity = [
      ...loadedCredentials.map(cred => ({
        date: cred.issueDate,
        action: 'Credential Issued',
        details: `${cred.title} to ${cred.studentName}`
      })),
      ...loadedStudents.map(student => ({
        date: student.registrationDate,
        action: 'Student Registered',
        details: student.name
      }))
    ]
      .sort((a, b) => b.date - a.date)
      .slice(0, 10);

    setAnalyticsData({
      totalCredentials,
      totalStudents,
      credentialsByMonth,
      popularCredentials,
      activeStudents,
      recentActivity
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      {/* Header */}
      <div className="bg-black/40 border border-blue-500/20 rounded-2xl p-8">
        <div className="flex items-center mb-6">
          <ChartBarIcon className="w-8 h-8 text-blue-500 mr-3" />
          <h2 className="text-2xl font-semibold text-blue-300">Credential Analytics Dashboard</h2>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-blue-900/10 border border-blue-500/20 rounded-xl p-6">
            <div className="flex items-center mb-4">
              <DocumentCheckIcon className="w-6 h-6 text-blue-400 mr-2" />
              <h3 className="text-lg font-medium text-blue-300">Total Credentials</h3>
            </div>
            <p className="text-4xl font-bold text-white">{analyticsData.totalCredentials}</p>
            <p className="text-gray-400 text-sm mt-2">Credentials issued to date</p>
          </div>

          <div className="bg-blue-900/10 border border-blue-500/20 rounded-xl p-6">
            <div className="flex items-center mb-4">
              <UserGroupIcon className="w-6 h-6 text-blue-400 mr-2" />
              <h3 className="text-lg font-medium text-blue-300">Registered Students</h3>
            </div>
            <p className="text-4xl font-bold text-white">{analyticsData.totalStudents}</p>
            <p className="text-gray-400 text-sm mt-2">Total students in the system</p>
          </div>
        </div>
      </div>

      {/* Charts and Detailed Analytics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Credentials by Month */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-black/40 border border-blue-500/20 rounded-2xl p-8"
        >
          <h3 className="text-xl font-semibold text-blue-300 mb-6">Credentials by Month</h3>
          
          {analyticsData.credentialsByMonth.length === 0 ? (
            <div className="text-gray-400 text-center py-8">No credential data available</div>
          ) : (
            <div className="space-y-3">
              {analyticsData.credentialsByMonth.map((item, index) => (
                <div key={index} className="flex items-center">
                  <div className="w-24 text-gray-400">{item.month}</div>
                  <div className="flex-1 ml-4">
                    <div className="relative pt-1">
                      <div className="flex mb-2 items-center justify-between">
                        <div>
                          <span className="text-xs font-semibold inline-block text-blue-400">
                            {item.count} credential{item.count !== 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>
                      <div className="flex h-2 mb-4">
                        <div
                          style={{ width: `${Math.min(100, item.count * 15)}%` }}
                          className="rounded-full bg-gradient-to-r from-blue-500 to-purple-500"
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Popular Credentials */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-black/40 border border-blue-500/20 rounded-2xl p-8"
        >
          <h3 className="text-xl font-semibold text-blue-300 mb-6">Popular Credentials</h3>
          
          {analyticsData.popularCredentials.length === 0 ? (
            <div className="text-gray-400 text-center py-8">No credential data available</div>
          ) : (
            <ul className="space-y-4">
              {analyticsData.popularCredentials.map((item, index) => (
                <li key={index} className="flex items-center justify-between border-b border-blue-500/10 pb-3">
                  <div>
                    <div className="font-medium text-white">{item.title}</div>
                    <div className="text-sm text-gray-400">{item.count} issuance{item.count !== 1 ? 's' : ''}</div>
                  </div>
                  <div className="flex items-center">
                    {[...Array(Math.min(5, item.count))].map((_, i) => (
                      <DocumentCheckIcon key={i} className="w-4 h-4 text-blue-400 ml-1" />
                    ))}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </motion.div>

        {/* Active Students */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-black/40 border border-blue-500/20 rounded-2xl p-8"
        >
          <h3 className="text-xl font-semibold text-blue-300 mb-6">Most Active Students</h3>
          
          {analyticsData.activeStudents.length === 0 ? (
            <div className="text-gray-400 text-center py-8">No student activity data available</div>
          ) : (
            <ul className="space-y-4">
              {analyticsData.activeStudents.map((item, index) => (
                <li key={index} className="flex items-center justify-between border-b border-blue-500/10 pb-3">
                  <div>
                    <div className="font-medium text-white">{item.name}</div>
                    <div className="text-sm text-gray-400">{item.credentials} credential{item.credentials !== 1 ? 's' : ''}</div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-black/40 border border-blue-500/20 rounded-2xl p-8"
        >
          <h3 className="text-xl font-semibold text-blue-300 mb-6">Recent Activity</h3>
          
          {analyticsData.recentActivity.length === 0 ? (
            <div className="text-gray-400 text-center py-8">No recent activity</div>
          ) : (
            <ul className="space-y-4">
              {analyticsData.recentActivity.map((item, index) => (
                <li key={index} className="flex items-start space-x-3 border-b border-blue-500/10 pb-3">
                  <ClockIcon className="w-5 h-5 text-blue-400 mt-1" />
                  <div>
                    <div className="font-medium text-white">{item.action}</div>
                    <div className="text-sm text-gray-400">{item.details}</div>
                    <div className="text-xs text-gray-500 mt-1">{new Date(item.date).toLocaleString()}</div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
} 