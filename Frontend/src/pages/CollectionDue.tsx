import React, { useState, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart, Wallet, Landmark, Smartphone, Banknote, User, Calendar, Search, X, Loader2
} from 'lucide-react';

import Sidebar from '../components/Sidebar';
import api from '../services/api';

// --- TYPE DEFINITIONS ---
interface Collection {
  historyId: number;
  studentId: number;
  name: string;
  shiftTitle: string | null;
  totalFee: number;
  amountPaid: number;
  dueAmount: number;
  cash: number;
  online: number;
  securityMoney: number;
  remark: string;
  createdAt: string | null;
  branchId?: number;
  branchName?: string;
  phone: string;
}

interface Branch {
  id: number;
  name: string;
}

// --- HELPER COMPONENTS ---

// A dedicated component for the summary statistic cards
const StatCard: React.FC<{ title: string; value: string; icon: React.ReactNode; color: string }> = ({ title, value, icon, color }) => (
  <motion.div
    className="bg-white p-4 rounded-lg shadow-sm border flex items-center space-x-4"
    whileHover={{ scale: 1.03 }}
    transition={{ type: 'spring', stiffness: 300 }}
  >
    <div className={`p-3 rounded-full ${color}`}>
      {icon}
    </div>
    <div>
      <h3 className="text-sm font-medium text-gray-500">{title}</h3>
      <p className="text-2xl font-bold text-gray-800 tabular-nums">{value}</p>
    </div>
  </motion.div>
);

// A skeleton loader for a better loading UX
const CollectionSkeleton: React.FC = () => (
  <div className="max-w-7xl mx-auto animate-pulse">
    <div className="h-10 bg-gray-200 rounded-md w-1/3 mb-4"></div>
    <div className="h-6 bg-gray-200 rounded-md w-1/2 mb-6"></div>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
      {Array(6).fill(0).map((_, i) => (
        <div key={i} className="bg-gray-200 h-24 rounded-lg"></div>
      ))}
    </div>
    <div className="bg-gray-200 rounded-lg h-96"></div>
  </div>
);


// --- MAIN COMPONENT ---
const CollectionDue: React.FC = () => {
  const currentMonth = new Date().toISOString().slice(0, 7);

  // --- STATE MANAGEMENT ---
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonth);
  const [selectedBranchId, setSelectedBranchId] = useState<number | null>(null);
  const [showOnlyDue, setShowOnlyDue] = useState(false);

  // Modal states
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'online' | null>(null);


  // --- DATA FETCHING ---

  // Refactored to a reusable function to avoid code duplication
  const loadCollections = async () => {
    try {
      const params: { month?: string; branchId?: number } = {};
      if (selectedMonth) params.month = selectedMonth;
      if (selectedBranchId) params.branchId = selectedBranchId;
      const data = await api.getCollections(params);

      if (!data || !Array.isArray(data.collections)) {
        throw new Error('Invalid data structure received from server');
      }

      const mappedData: Collection[] = data.collections.map((c: any) => ({
        historyId: c.historyId,
        studentId: c.studentId,
        name: c.name,
        shiftTitle: c.shiftTitle,
        totalFee: Number(c.totalFee) || 0,
        amountPaid: Number(c.amountPaid) || 0,
        dueAmount: Number(c.dueAmount) || 0,
        cash: Number(c.cash) || 0,
        online: Number(c.online) || 0,
        securityMoney: Number(c.securityMoney) || 0,
        remark: c.remark || '',
        createdAt: c.createdAt,
        branchId: c.branchId,
        branchName: c.branchName,
        phone: c.phone || 'N/A',
      }));
      setCollections(mappedData);
    } catch (err: any) {
      console.error('Failed to fetch collections:', err);
      toast.error(err.message || 'Failed to load collection data.');
      setCollections([]); // Reset to empty on error
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const branchesData = await api.getBranches();
        setBranches(branchesData);
      } catch (error) {
        console.error('Failed to fetch branches:', error);
        toast.error('Failed to load branches.');
      }
    };
    fetchBranches();
  }, []);

  useEffect(() => {
    setLoading(true);
    loadCollections();
  }, [selectedMonth, selectedBranchId]);


  // --- MEMOIZED COMPUTATIONS for performance ---

  const filteredCollections = useMemo(() => {
    let filtered = collections.filter(col => {
      const searchTermLower = searchTerm.toLowerCase();
      return (
        col.name.toLowerCase().includes(searchTermLower) ||
        col.studentId.toString().includes(searchTermLower) ||
        col.phone.toLowerCase().includes(searchTermLower)
      );
    });

    if (showOnlyDue) {
      filtered = filtered.filter(col => col.dueAmount > 0);
    }

    return filtered;
  }, [collections, searchTerm, showOnlyDue]);

  const summaryStats = useMemo(() => ({
    totalStudents: filteredCollections.length,
    totalCollected: filteredCollections.reduce((sum, c) => sum + c.amountPaid, 0),
    totalDue: filteredCollections.reduce((sum, c) => sum + c.dueAmount, 0),
    totalCash: filteredCollections.reduce((sum, c) => sum + c.cash, 0),
    totalOnline: filteredCollections.reduce((sum, c) => sum + c.online, 0),
    totalSecurityMoney: filteredCollections.reduce((sum, c) => sum + c.securityMoney, 0),
  }), [filteredCollections]);


  // --- EVENT HANDLERS ---

  const handlePayDueClick = (collection: Collection) => {
    setSelectedCollection(collection);
    setPaymentAmount(collection.dueAmount.toString()); // Pre-fill with full due amount
    setPaymentMethod(null);
    setIsPayModalOpen(true);
  };

  const handlePaymentSubmit = async () => {
    if (!selectedCollection || !paymentMethod || !paymentAmount) {
      toast.error('Please select a payment method and enter an amount.');
      return;
    }
    const payment = parseFloat(paymentAmount);
    if (isNaN(payment) || payment <= 0 || payment > selectedCollection.dueAmount) {
      toast.error(`Invalid amount. Must be between ₹0.01 and ₹${selectedCollection.dueAmount.toFixed(2)}.`);
      return;
    }

    setIsSubmitting(true);

    // --- Optimistic UI Update ---
    const originalCollections = [...collections];
    const updatedCollections = collections.map(c =>
      c.historyId === selectedCollection.historyId
        ? {
          ...c,
          amountPaid: c.amountPaid + payment,
          dueAmount: c.dueAmount - payment,
          ...(paymentMethod === 'cash' && { cash: c.cash + payment }),
          ...(paymentMethod === 'online' && { online: c.online + payment }),
        }
        : c
    );
    setCollections(updatedCollections);
    setIsPayModalOpen(false);

    try {
      await api.updateCollectionPayment(selectedCollection.historyId, {
        amount: payment,
        method: paymentMethod,
      });
      toast.success('Payment updated successfully!');
    } catch (err: any) {
      // Revert UI on failure
      setCollections(originalCollections);
      toast.error(err.message || 'Failed to update payment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };


  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />

      <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
        {loading ? (
          <CollectionSkeleton />
        ) : (
          <motion.div
            className="max-w-7xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* --- HEADER --- */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
                <div className="mb-4 md:mb-0">
                    <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
                        <BarChart className="w-8 h-8 text-purple-600" />
                        Collection & Due
                    </h1>
                    <p className="text-gray-500 mt-1">
                        View and manage student payment details.
                    </p>
                </div>
            </div>


            {/* --- FILTERS --- */}
            <motion.div
              className="mb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.4 }}
            >
              <div className="relative lg:col-span-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name, registration no, or phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full p-2 pl-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400 transition"
                />
              </div>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400 transition"
              />
              <select
                value={selectedBranchId || ''}
                onChange={(e) => setSelectedBranchId(e.target.value ? Number(e.target.value) : null)}
                className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400 transition"
              >
                <option value="">All Branches</option>
                {branches.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name}
                  </option>
                ))}
              </select>
              <div className="lg:col-span-4 mt-2">
                <label className="flex items-center text-gray-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showOnlyDue}
                    onChange={(e) => setShowOnlyDue(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500 mr-2"
                  />
                  Show only students with due amounts
                </label>
              </div>
            </motion.div>

            {/* --- STATS GRID --- */}
            <motion.div
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2, staggerChildren: 0.1 }}
            >
                <StatCard title="Total Students" value={summaryStats.totalStudents.toString()} icon={<User className="w-6 h-6 text-blue-600" />} color="bg-blue-100" />
                <StatCard title="Total Collected" value={`₹${summaryStats.totalCollected.toFixed(2)}`} icon={<Wallet className="w-6 h-6 text-green-600" />} color="bg-green-100" />
                <StatCard title="Total Due" value={`₹${summaryStats.totalDue.toFixed(2)}`} icon={<Landmark className="w-6 h-6 text-red-600" />} color="bg-red-100" />
                <StatCard title="Cash Collected" value={`₹${summaryStats.totalCash.toFixed(2)}`} icon={<Banknote className="w-6 h-6 text-emerald-600" />} color="bg-emerald-100" />
                <StatCard title="Online Collected" value={`₹${summaryStats.totalOnline.toFixed(2)}`} icon={<Smartphone className="w-6 h-6 text-sky-600" />} color="bg-sky-100" />
                <StatCard title="Registration Fee" value={`₹${summaryStats.totalSecurityMoney.toFixed(2)}`} icon={<User className="w-6 h-6 text-indigo-600" />} color="bg-indigo-100" />
            </motion.div>

            {/* --- DATA TABLE --- */}
            <div className="bg-white rounded-lg shadow-sm border overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {['Student', 'Reg. No', 'Total Fee', 'Cash', 'Online', 'Reg. Fee', 'Paid', 'Due', 'Remark', 'Created At', 'Action'].map(header => (
                       <th key={header} className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                           {header}
                       </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  <AnimatePresence>
                    {filteredCollections.length === 0 ? (
                      <tr>
                        <td colSpan={12} className="px-6 py-16 text-center text-gray-500">
                           <h3 className='text-lg font-medium'>No Collections Found</h3>
                           <p className='mt-1 text-sm'>Try adjusting your search or filter criteria.</p>
                        </td>
                      </tr>
                    ) : (
                      filteredCollections.map((collection) => (
                        <motion.tr
                          key={collection.historyId}
                          layout
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="hover:bg-gray-50 transition-colors"
                        >
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{collection.name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 tabular-nums">{collection.studentId}</td>
                          {/* <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 tabular-nums">{collection.phone}</td> */}
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 tabular-nums">₹{collection.totalFee.toFixed(2)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 tabular-nums">₹{collection.cash.toFixed(2)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 tabular-nums">₹{collection.online.toFixed(2)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 tabular-nums">₹{collection.securityMoney.toFixed(2)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600 tabular-nums">₹{collection.amountPaid.toFixed(2)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-red-600 tabular-nums">₹{collection.dueAmount.toFixed(2)}</td>
                          <td className="px-6 py-4 text-sm text-gray-500 min-w-[150px] whitespace-normal">{collection.remark || 'N/A'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {collection.createdAt ? new Date(collection.createdAt).toLocaleDateString('en-CA') : 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {collection.dueAmount > 0 && (
                              <button
                                onClick={() => handlePayDueClick(collection)}
                                className="flex items-center px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-semibold hover:bg-purple-200 transition-colors"
                              >
                                Pay Due
                              </button>
                            )}
                          </td>
                        </motion.tr>
                      ))
                    )}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {/* --- PAYMENT MODAL --- */}
        <AnimatePresence>
            {isPayModalOpen && selectedCollection && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm z-50">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                        className="bg-white p-6 rounded-xl shadow-2xl max-w-md w-full m-4"
                    >
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold text-gray-800">Pay Due for {selectedCollection.name}</h3>
                            <button onClick={() => setIsPayModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <X size={24} />
                            </button>
                        </div>

                        <p className="text-sm text-gray-500 mb-4">
                            Current Due Amount: <span className="font-bold text-red-600">₹{selectedCollection.dueAmount.toFixed(2)}</span>
                        </p>

                        <div className="space-y-4">
                            <div>
                                <label className="text-sm font-medium text-gray-700 mb-2 block">Payment Method</label>
                                <div className="flex space-x-4">
                                    {['cash', 'online'].map(method => (
                                        <button
                                            key={method}
                                            onClick={() => setPaymentMethod(method as 'cash' | 'online')}
                                            className={`flex-1 py-2 text-sm font-semibold rounded-lg border-2 transition-all ${
                                                paymentMethod === method ? 'border-purple-600 bg-purple-50 text-purple-700' : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                                            }`}
                                        >
                                            {method.charAt(0).toUpperCase() + method.slice(1)}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label htmlFor="paymentAmount" className="text-sm font-medium text-gray-700 mb-2 block">Payment Amount</label>
                                <input
                                    id="paymentAmount"
                                    type="number"
                                    value={paymentAmount}
                                    onChange={(e) => setPaymentAmount(e.target.value)}
                                    placeholder="Enter payment amount"
                                    className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400 transition"
                                    step="0.01" min="0.01" max={selectedCollection.dueAmount.toString()}
                                />
                            </div>
                        </div>

                        <div className="flex justify-end space-x-3 mt-6">
                            <button
                                onClick={() => setIsPayModalOpen(false)}
                                className="px-4 py-2 border rounded-lg text-gray-700 bg-gray-50 hover:bg-gray-100 font-semibold transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handlePaymentSubmit}
                                disabled={isSubmitting}
                                className="px-4 py-2 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:bg-purple-300 disabled:cursor-not-allowed flex items-center justify-center min-w-[150px]"
                            >
                                {isSubmitting ? (
                                    <Loader2 className="animate-spin w-5 h-5" />
                                ) : (
                                    `Submit Payment`
                                )}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default CollectionDue;