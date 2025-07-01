import React, { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import api, { Branch, StudentSummary } from '../services/api';
import { Search, ChevronLeft, ChevronRight, Trash2, Eye, ArrowUp, ArrowDown } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

interface Student {
  id: number;
  name: string;
  phone: string;
  registrationNumber?: string | null;
  membershipEnd: string;
  createdAt: string;
  status: string;
  seatNumber?: string | null;
}

const formatDate = (dateString: string | undefined): string => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toISOString().split('T')[0];
};

const AllStudents = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<number | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [studentsPerPage, setStudentsPerPage] = useState(10);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [sortColumn, setSortColumn] = useState<'createdAt' | 'seatNumber' | null>(null);
  const [createdAtSortDirection, setCreatedAtSortDirection] = useState<'asc' | 'desc'>('desc');
  const [seatSortDirection, setSeatSortDirection] = useState<'asc' | 'desc'>('asc');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const fetchedBranches = await api.getBranches();
        setBranches(fetchedBranches);
      } catch (error: any) {
        console.error('Failed to fetch branches:', error.message);
        toast.error('Failed to fetch branches');
      }
    };

    fetchBranches();
  }, []);

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setLoading(true);
        const response = await api.getStudents(fromDate || undefined, toDate || undefined, selectedBranchId);
        const updatedStudents = response.students.map((student: StudentSummary) => {
          const membershipEndDate = new Date(student.membershipEnd);
          const currentDate = new Date();
          const isExpired = membershipEndDate < currentDate;
          return {
            ...student,
            status: isExpired ? 'expired' : student.status,
            createdAt: student.createdAt || 'N/A',
            registrationNumber: student.registrationNumber || 'N/A',
          };
        });
        setStudents(updatedStudents);
        setLoading(false);
      } catch (error: any) {
        console.error('Failed to fetch students:', error.message);
        toast.error('Failed to fetch students');
        setLoading(false);
      }
    };

    fetchStudents();
  }, [selectedBranchId, fromDate, toDate]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedBranchId, fromDate, toDate]);

  const handleSort = (column: 'createdAt' | 'seatNumber') => {
    setSortColumn(column);
    if (column === 'createdAt') {
      setCreatedAtSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSeatSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    }
  };

  const sortedStudents = [...students].sort((a, b) => {
    if (sortColumn === 'createdAt') {
      const dateA = new Date(a.createdAt);
      const dateB = new Date(b.createdAt);
      const timeA = isNaN(dateA.getTime()) ? new Date().getTime() : dateA.getTime();
      const timeB = isNaN(dateB.getTime()) ? new Date().getTime() : dateB.getTime();
      return createdAtSortDirection === 'asc' ? timeA - timeB : timeB - timeA;
    } else if (sortColumn === 'seatNumber') {
      const seatA = a.seatNumber || '';
      const seatB = b.seatNumber || '';
      return seatSortDirection === 'asc' 
        ? seatA.localeCompare(seatB, undefined, { numeric: true }) 
        : seatB.localeCompare(seatA, undefined, { numeric: true });
    }
    return 0;
  });

  const filteredStudents = sortedStudents.filter((student: Student) =>
    (student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
     student.phone.toLowerCase().includes(searchTerm.toLowerCase()) ||
     (student.registrationNumber && student.registrationNumber.toLowerCase().includes(searchTerm.toLowerCase())))
  );

  const indexOfLastStudent = currentPage * studentsPerPage;
  const indexOfFirstStudent = indexOfLastStudent - studentsPerPage;
  const currentStudents = filteredStudents.slice(indexOfFirstStudent, indexOfLastStudent);
  const totalPages = Math.ceil(filteredStudents.length / studentsPerPage);

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this student?')) {
      try {
        await api.deleteStudent(id);
        setStudents(students.filter((student) => student.id !== id));
        toast.success('Student deleted successfully');
      } catch (error: any) {
        console.error('Failed to delete student:', error.message);
        toast.error('Failed to delete student');
      }
    }
  };

  const handleViewDetails = (id: number) => {
    navigate(`/students/${id}`);
  };

  const handleWhatsApp = (phone: string) => {
    const cleanedPhone = phone.replace(/[^\d]/g, '');
    const whatsappUrl = `https://wa.me/${cleanedPhone}`;
    window.open(whatsappUrl, '_blank');
  };

  const selectedBranchName = selectedBranchId
    ? branches.find(branch => branch.id === selectedBranchId)?.name
    : null;

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar />
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-800">All Students</h1>
              <p className="text-gray-500">Manage all your students</p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-gray-200 flex flex-col md:flex-row items-start md:items-center justify-between space-y-2 md:space-y-0">
                <h3 className="text-lg font-medium">Students List</h3>
                <div className="relative w-full md:w-64">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    type="text"
                    placeholder="Search by name, phone, or registration number..."
                    className="w-full pl-10 pr-4 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-purple-300"
                    value={searchTerm}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <div className="p-4 flex flex-col md:flex-row items-start md:items-center space-y-2 md:space-y-0 md:space-x-4">
                <div className="flex items-center space-x-2">
                  <label className="text-sm text-gray-500">Branch:</label>
                  <select
                    value={selectedBranchId ?? ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      setSelectedBranchId(value ? Number(value) : undefined);
                    }}
                    className="p-2 border rounded text-sm"
                  >
                    <option value="">All Branches</option>
                    {branches.map(branch => (
                      <option key={branch.id} value={branch.id}>
                        {branch.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center space-x-2">
                  <label className="text-sm text-gray-500">From:</label>
                  <input
                    type="date"
                    value={fromDate}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFromDate(e.target.value)}
                    className="p-2 border rounded"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <label className="text-sm text-gray-500">To:</label>
                  <input
                    type="date"
                    value={toDate}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setToDate(e.target.value)}
                    className="p-2 border rounded"
                  />
                </div>
              </div>
              {loading ? (
                <div className="flex justify-center p-8">Loading students...</div>
              ) : (
                <>
                  <div className="p-4">
                    {selectedBranchId && selectedBranchName ? (
                      <p>Showing students for branch: {selectedBranchName}</p>
                    ) : fromDate && toDate ? (
                      <p>Showing students added from {fromDate} to {toDate}</p>
                    ) : (
                      <p>Showing all students</p>
                    )}
                  </div>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Registration Number</TableHead>
                          <TableHead className="hidden md:table-cell">Phone</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="hidden md:table-cell">Membership End</TableHead>
                          <TableHead className="hidden md:table-cell">
                            <button
                              className="flex items-center gap-1 hover:text-purple-600"
                              onClick={() => handleSort('seatNumber')}
                            >
                              Seat
                              {sortColumn === 'seatNumber' && 
                                (seatSortDirection === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />)}
                            </button>
                          </TableHead>
                          <TableHead>
                            <button
                              className="flex items-center gap-1 hover:text-purple-600"
                              onClick={() => handleSort('createdAt')}
                            >
                              Added On
                              {sortColumn === 'createdAt' && 
                                (createdAtSortDirection === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />)}
                            </button>
                          </TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {currentStudents.length > 0 ? (
                          currentStudents.map((student: Student) => (
                            <TableRow key={student.id}>
                              <TableCell>{student.name}</TableCell>
                              <TableCell>{student.registrationNumber || 'N/A'}</TableCell>
                              <TableCell className="hidden md:table-cell">{student.phone}</TableCell>
                              <TableCell>
                                <span
                                  className={`px-2 py-1 rounded-full text-xs ${
                                    student.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                  }`}
                                >
                                  {student.status === 'active' ? 'Active' : 'Expired'}
                                </span>
                              </TableCell>
                              <TableCell className="hidden md:table-cell">{formatDate(student.membershipEnd)}</TableCell>
                              <TableCell className="hidden md:table-cell">{student.seatNumber || 'N/A'}</TableCell>
                              <TableCell>{formatDate(student.createdAt)}</TableCell>
                              <TableCell>
                                <button
                                  onClick={() => handleViewDetails(student.id)}
                                  className="mr-2 text-blue-600 hover:text-blue-800 p-2"
                                >
                                  <Eye size={16} />
                                </button>
                                <button
                                  onClick={() => handleDelete(student.id)}
                                  className="text-red-600 hover:text-red-800 p-2"
                                >
                                  <Trash2 size={16} />
                                </button>
                                <button
                                  onClick={() => handleWhatsApp(student.phone)}
                                  className="text-green-600 hover:text-green-800 p-2"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-whatsapp" viewBox="0 0 16 16">
                                    <path d="M13.601 2.326A7.854 7.854 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.933 7.933 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.898 7.898 0 0 0 13.6 2.326zM7.994 14.521a6.573 6.573 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.557 6.557 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592zm3.615-4.934c-.197-.099-1.17-.578-1.353-.654-.182-.076-.314-.104-.443.099-.132.203-.428.65-.809.803-.364.146-.529.154-.841.134-.32-.019-.694-.023-1.085-.003-.392.019-.351.045-.581.271-.228.226-.54.299-.777.161-.237-.137-.436-.336-.517-.558-.08-.222-.289-.417-.526-.567-.237-.149-.47-.185-.5-.255-.03-.07.012-.087.189-.267.173-.179.489-.563.731-.815.243-.252.408-.386.46-.403.052-.017.077-.023.14-.023.063 0 .237.09.403.362.165.273.43.749.568 1.15.14.401.212.576.285.523.074-.053.4-.598.926-1.168.526-.569.935-.862 1.135-.907.2-.045.323.014.403.099.08.085.115.194.106.271-.009.076-.4.297-.896.753-.494.457-.878.863-1.087 1.129-.209.266-.18.391-.097.598.082.207.289.387.472.528.183.141.37.193.578.15.207-.043.561-.24 1.007-.436.446-.196.862-.36 1.214-.36.127 0 .259.012.394.039.135.027.267.073.398.137.131.064.249.147.354.246.105.099.194.197.258.343.064.145.087.29.061.435-.025.144-.121.277-.246.393-.125.116-.298.214-.487.284-.189.07-.385.107-.599.091-.214-.016-.414-.081-.736-.166-.322-.085-.593-.16-.829-.258z"/>
                                  </svg>
                                </button>
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                              {selectedBranchId && selectedBranchName
                                ? `No students found for branch: ${selectedBranchName}`
                                : fromDate && toDate
                                ? `No students found for the selected date range.`
                                : 'No students found.'}
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </>
              )}
              {!loading && filteredStudents.length > 0 && (
                <div className="flex flex-col md:flex-row items-center justify-between border-t border-gray-200 px-6 py-3 space-y-2 md:space-y-0">
                  <div className="flex items-center space-x-2">
                    <select
                      value={studentsPerPage}
                      onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                        setStudentsPerPage(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                      className="text-sm border rounded py-2 px-3"
                    >
                      <option value={10}>10</option>
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                    </select>
                    <span className="text-sm text-gray-500">students per page</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="p-2 rounded border border-gray-200 hover:bg-gray-50 disabled:opacity-50"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <span className="text-sm">
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="p-2 rounded border border-gray-200 hover:bg-gray-50 disabled:opacity-50"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                  <div className="text-sm text-gray-500">
                    Showing {indexOfFirstStudent + 1} to {Math.min(indexOfLastStudent, filteredStudents.length)} of {filteredStudents.length} students
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AllStudents;