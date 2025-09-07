// Sidebar.tsx
import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, UserPlus, Building2, Calendar, Clock, Grid, DollarSign, Wallet, ShoppingBag, BarChart2, Settings, ChevronRight, UserCheck, AlertTriangle, Menu, X, LogOut, MapPin, Package } from 'lucide-react';
import { useMediaQuery } from 'react-responsive';
import logo from './MansaLogo.png';

interface SidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, setIsCollapsed }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [showStudentDropdown, setShowStudentDropdown] = useState(false);
  const [showHostelDropdown, setShowHostelDropdown] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const isMobile = useMediaQuery({ query: '(max-width: 767px)' });
  const effectiveIsCollapsed = isMobile ? false : isCollapsed;

  const isActive = (path: string) => location.pathname === path;

  const menuItems = [
    { path: '/', icon: <Home size={20} />, label: 'Home' },
    { path: '/students', icon: <UserPlus size={20} />, label: 'Students', hasDropdown: true },
    // { path: '/hostel', icon: <Building2 size={20} />, label: 'Hostel', hasDropdown: true },
    { path: '/schedule', icon: <Calendar size={20} />, label: 'Schedule' },
    { path: '/shifts', icon: <Clock size={20} />, label: 'Shifts' },
    { path: '/seats', icon: <Grid size={20} />, label: 'Seats' },
    { path: '/branches', icon: <MapPin size={20} />, label: 'Manage Branches' }, // New item
    { path: '/products', icon: <Package size={20} />, label: 'Products' }, // New item
    { path: '/transactions', icon: <DollarSign size={20} />, label: 'Transactions' },
    { path: '/collections', icon: <Wallet size={20} />, label: 'Collection & Due' },
    { path: '/expenses', icon: <ShoppingBag size={20} />, label: 'Expenses' },
    { path: '/profit-loss', icon: <BarChart2 size={20} />, label: 'Profit & Loss' },
    { path: '/settings', icon: <Settings size={20} />, label: 'Settings' },
  ];

  const handleLogout = () => {
    navigate('/login');
    if (isMobile) setIsSidebarOpen(false);
  };

  return (
    <>
      {isMobile && (
        <button
          className="fixed top-4 left-4 z-50 md:hidden p-2 rounded-md bg-white shadow-md"
          onClick={() => setIsSidebarOpen(true)}
        >
          <Menu size={24} />
        </button>
      )}
      {isMobile && isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}
      <div
        className={`h-screen bg-gradient-to-br from-purple-50 to-orange-50 border-r border-gray-100 flex flex-col transition-all duration-300 ${
          isMobile ? (isSidebarOpen ? 'fixed top-0 left-0 z-50 w-64' : 'hidden') : (effectiveIsCollapsed ? 'w-16' : 'w-64')
        }`}
      >
        <div className="p-4 flex items-center justify-between">
          {!effectiveIsCollapsed && (
            <div className="flex items-center gap-2">
              <img src={logo} alt="Library Logo" className="h-10 w-10 rounded-full object-cover" />
              <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-orange-400 text-transparent bg-clip-text">
                MANSA LIBRARY
              </h1>
            </div>
          )}
          {isMobile ? (
            <button onClick={() => setIsSidebarOpen(false)} className="p-1 rounded-full hover:bg-gray-100">
              <X size={20} />
            </button>
          ) : (
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-1 rounded-full hover:bg-gray-100"
            >
              <ChevronRight size={20} className={`${isCollapsed ? 'rotate-180' : ''}`} />
            </button>
          )}
        </div>
        <nav className="flex-1 px-2 py-4">
          <ul className="space-y-1">
            {menuItems.map((item) => (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`flex items-center px-3 py-2 rounded-lg transition-colors ${
                    isActive(item.path)
                      ? 'bg-purple-100 text-purple-600'
                      : 'text-gray-700 hover:bg-gray-100'
                  } ${effectiveIsCollapsed ? 'justify-center' : 'justify-between'}`}
                  onClick={(e) => {
                    if (item.hasDropdown && item.label === 'Students' && !effectiveIsCollapsed) {
                      e.preventDefault();
                      setShowStudentDropdown(!showStudentDropdown);
                    } else if (item.hasDropdown && item.label === 'Hostel' && !effectiveIsCollapsed) {
                      e.preventDefault();
                      setShowHostelDropdown(!showHostelDropdown);
                    } else if (isMobile) {
                      setIsSidebarOpen(false);
                    }
                  }}
                >
                  <div className={`flex items-center gap-3 ${effectiveIsCollapsed ? 'justify-center' : ''}`}>
                    <span className={isActive(item.path) ? 'text-purple-600' : 'text-gray-500'}>{item.icon}</span>
                    {!effectiveIsCollapsed && <span className="font-medium">{item.label}</span>}
                  </div>
                  {!effectiveIsCollapsed && item.hasDropdown && (
                    <ChevronRight
                      size={18}
                      className={`transition-transform ${
                        (item.label === 'Students' && showStudentDropdown) || 
                        (item.label === 'Hostel' && showHostelDropdown) ? 'rotate-90' : ''
                      }`}
                    />
                  )}
                </Link>
                {!effectiveIsCollapsed && item.hasDropdown && showStudentDropdown && item.label === 'Students' && (
                  <div className="ml-8 mt-1 space-y-1 animate-fade-in">
                    <Link
                      to="/students/add"
                      className={`block py-2 px-3 rounded-md text-sm font-medium ${
                        isActive('/students/add') ? 'bg-purple-50 text-purple-600' : 'text-gray-700 hover:bg-gray-100'
                      }`}
                      onClick={() => isMobile && setIsSidebarOpen(false)}
                    >
                      Add Student
                    </Link>
                    <Link
                      to="/students"
                      className={`block py-2 px-3 rounded-md text-sm font-medium ${
                        isActive('/students') ? 'bg-purple-50 text-purple-600' : 'text-gray-700 hover:bg-gray-100'
                      }`}
                      onClick={() => isMobile && setIsSidebarOpen(false)}
                    >
                      View All
                    </Link>
                    <Link
                      to="/active-students"
                      className={`flex items-center py-2 px-3 rounded-md text-sm font-medium ${
                        isActive('/active-students') ? 'bg-purple-50 text-purple-600' : 'text-gray-700 hover:bg-gray-100'
                      }`}
                      onClick={() => isMobile && setIsSidebarOpen(false)}
                    >
                      <UserCheck size={14} className="mr-1.5" />
                      Active Students
                    </Link>
                    <Link
                      to="/expired-memberships"
                      className={`flex items-center py-2 px-3 rounded-md text-sm font-medium ${
                        isActive('/expired-memberships')
                          ? 'bg-purple-50 text-purple-600'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                      onClick={() => isMobile && setIsSidebarOpen(false)}
                    >
                      <AlertTriangle size={14} className="mr-1.5" />
                      Expired Members
                    </Link>
                  </div>
                )}
                {!effectiveIsCollapsed && item.hasDropdown && showHostelDropdown && item.label === 'Hostel' && (
                  <div className="ml-8 mt-1 space-y-1 animate-fade-in">
                    <Link
                      to="/hostel"
                      className={`block py-2 px-3 rounded-md text-sm font-medium ${
                        isActive('/hostel') ? 'bg-purple-50 text-purple-600' : 'text-gray-700 hover:bg-gray-100'
                      }`}
                      onClick={() => isMobile && setIsSidebarOpen(false)}
                    >
                      Students
                    </Link>
                    <Link
                      to="/hostel/collections"
                      className={`block py-2 px-3 rounded-md text-sm font-medium ${
                        isActive('/hostel/collections') ? 'bg-purple-50 text-purple-600' : 'text-gray-700 hover:bg-gray-100'
                      }`}
                      onClick={() => isMobile && setIsSidebarOpen(false)}
                    >
                      Collection & Due
                    </Link>
                    <Link
                      to="/hostel/expired"
                      className={`block py-2 px-3 rounded-md text-sm font-medium ${
                        isActive('/hostel/expired') ? 'bg-purple-50 text-purple-600' : 'text-gray-700 hover:bg-gray-100'
                      }`}
                      onClick={() => isMobile && setIsSidebarOpen(false)}
                    >
                      Expired Memberships
                    </Link>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </nav>
        <div className="p-2">
          <button
            className={`flex items-center w-full px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors ${
              effectiveIsCollapsed ? 'justify-center' : ''
            }`}
            onClick={handleLogout}
          >
            <div className={`flex items-center gap-3 ${effectiveIsCollapsed ? 'justify-center' : ''}`}>
              <LogOut size={20} className="text-gray-500" />
              {!effectiveIsCollapsed && <span className="font-medium">Logout</span>}
            </div>
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;