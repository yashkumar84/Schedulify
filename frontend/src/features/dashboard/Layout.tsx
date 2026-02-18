import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import {
    LayoutDashboard,
    Briefcase,
    CheckSquare,
    CreditCard,
    Users,
    LogOut,
    Menu,
    X,
    Bell,
    Search,
    UserCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const { user, logout } = useAuthStore();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const navItems = [
        { name: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
        { name: 'Projects', icon: Briefcase, path: '/projects' },
        { name: 'Tasks', icon: CheckSquare, path: '/tasks' },
        { name: 'Expenses', icon: CreditCard, path: '/expenses' },
        { name: 'Team', icon: Users, path: '/team' },
        { name: 'Profile', icon: UserCircle, path: '/profile' },
    ];

    return (
        <div className="min-h-screen bg-background">
            {/* Mobile Header */}
            <div className="lg:hidden flex items-center justify-between p-4 bg-card border-b border-border sticky top-0 z-50">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-primary-600 rounded-lg" />
                    <span className="font-bold text-xl tracking-tight">TaskiFy</span>
                </div>
                <button
                    onClick={() => setIsSidebarOpen(true)}
                    className="p-2 text-secondary-600 hover:bg-secondary-100 rounded-lg transition-colors"
                >
                    <Menu size={24} />
                </button>
            </div>

            {/* Sidebar Overlay (Mobile) */}
            <AnimatePresence>
                {isSidebarOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsSidebarOpen(false)}
                            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 lg:hidden"
                        />
                        <motion.div
                            initial={{ x: '-100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '-100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="fixed inset-y-0 left-0 w-72 bg-card z-50 p-6 shadow-2xl lg:hidden flex flex-col"
                        >
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 bg-primary-600 rounded-lg" />
                                    <span className="font-bold text-xl tracking-tight">TaskiFy</span>
                                </div>
                                <button onClick={() => setIsSidebarOpen(false)}>
                                    <X size={24} className="text-secondary-500" />
                                </button>
                            </div>

                            <nav className="flex-1 space-y-2">
                                {navItems.map((item) => (
                                    <NavLink
                                        key={item.path}
                                        to={item.path}
                                        onClick={() => setIsSidebarOpen(false)}
                                        className={({ isActive }) =>
                                            `flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive
                                                ? 'bg-primary-50 text-primary-600 font-semibold'
                                                : 'text-secondary-600 hover:bg-secondary-50'
                                            }`
                                        }
                                    >
                                        <item.icon size={20} />
                                        {item.name}
                                    </NavLink>
                                ))}
                            </nav>

                            <button
                                onClick={handleLogout}
                                className="flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl transition-all mt-auto"
                            >
                                <LogOut size={20} />
                                Logout
                            </button>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Desktop Sidebar */}
            <aside className="hidden lg:flex fixed inset-y-0 left-0 w-64 bg-card border-r border-border p-6 flex-col">
                <div className="flex items-center gap-2 mb-10">
                    <div className="w-8 h-8 bg-primary-600 rounded-lg shadow-lg shadow-primary-500/20" />
                    <span className="font-bold text-xl tracking-tight">TaskiFy</span>
                </div>

                <nav className="flex-1 space-y-1">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 ${isActive
                                    ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/20'
                                    : 'text-secondary-600 hover:bg-secondary-50 hover:text-secondary-900'
                                }`
                            }
                        >
                            <item.icon size={20} />
                            {item.name}
                        </NavLink>
                    ))}
                </nav>

                <div
                    className="mt-auto p-4 bg-secondary-50 rounded-2xl flex items-center gap-3 cursor-pointer hover:bg-secondary-100 transition-all"
                    onClick={() => navigate('/profile')}
                >
                    <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold font-display">
                        {user?.name?.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate">{user?.name}</p>
                        <p className="text-xs text-secondary-500 truncate capitalize">{user?.role?.replace('_', ' ').toLowerCase()}</p>
                    </div>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            handleLogout();
                        }}
                        className="text-secondary-400 hover:text-red-500 transition-colors"
                    >
                        <LogOut size={18} />
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="lg:ml-64 min-h-screen">
                {/* Topbar Desktop */}
                <header className="hidden lg:flex items-center justify-between h-20 px-8 bg-background/80 backdrop-blur-md sticky top-0 z-40">
                    <div className="relative w-96">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search projects, tasks, expenses..."
                            className="w-full pl-10 pr-4 py-2 bg-secondary-100 hover:bg-secondary-200 focus:bg-white border-transparent focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 rounded-xl transition-all outline-none text-sm"
                        />
                    </div>
                    <div className="flex items-center gap-4">
                        <button className="p-2 text-secondary-500 hover:bg-secondary-100 rounded-lg relative transition-colors">
                            <Bell size={20} />
                            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-background" />
                        </button>
                        <div className="h-8 w-px bg-border mx-2" />
                        <div
                            className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={() => navigate('/profile')}
                        >
                            <span className="text-sm font-medium">{user?.name}</span>
                            <div className="w-10 h-10 rounded-full bg-primary-100 border-2 border-white shadow-sm overflow-hidden">
                                <img src={`https://ui-avatars.com/api/?name=${user?.name || 'User'}&background=random`} alt="Avatar" />
                            </div>
                        </div>
                    </div>
                </header>

                <div className="p-4 lg:p-8">
                    {children}
                </div>
            </main>
        </div>
    );
};

export default Layout;
