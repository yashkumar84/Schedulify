import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useNotifications, useMarkNotificationRead, useMarkAllNotificationsRead } from '../../hooks/useApi';
import { getSocket } from '../../utils/socket';
import {
    LayoutDashboard,
    Briefcase,
    CheckSquare,
    AlertCircle,
    CreditCard,
    Users,
    LogOut,
    Menu,
    X,
    Bell,
    Search,
    UserCircle,
    Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isNotificationOpen, setIsNotificationOpen] = useState(false);
    const { user, logout } = useAuthStore();
    const navigate = useNavigate();


    const { data: notifications, refetch: refetchNotifications } = useNotifications();
    const markRead = useMarkNotificationRead();
    const markAllRead = useMarkAllNotificationsRead();

    const unreadCount = notifications?.filter((n: any) => !n.read).length || 0;

    useEffect(() => {
        const socket = getSocket();
        if (socket) {
            socket.on('new-notification', () => {
                refetchNotifications();
            });
            return () => {
                socket.off('new-notification');
            };
        }
    }, [refetchNotifications]);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const isSuperAdmin = user?.role === 'SUPER_ADMIN';
    const perms = user?.permissions;

    const navItems = [
        { name: 'Dashboard', icon: LayoutDashboard, path: '/dashboard', visible: true },
        { name: 'Projects', icon: Briefcase, path: '/projects', visible: isSuperAdmin || !!perms?.projects?.read },
        { name: 'Tasks', icon: CheckSquare, path: '/tasks', visible: isSuperAdmin || !!perms?.tasks?.read },
        { name: 'Global Tasks', icon: AlertCircle, path: '/global-tasks', visible: isSuperAdmin },
        { name: 'Expenses', icon: CreditCard, path: '/expenses', visible: isSuperAdmin || !!perms?.finance?.read },
        { name: 'Team', icon: Users, path: '/team', visible: isSuperAdmin || !!perms?.team?.read },
        { name: 'Profile', icon: UserCircle, path: '/profile', visible: true },
    ];

    const filteredNavItems = navItems.filter(item => item.visible);

    return (
        <div className="min-h-screen bg-background">
            {/* Mobile Header */}
            <div className="lg:hidden flex items-center justify-between p-4 bg-card border-b border-border sticky top-0 z-50">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-primary-600 rounded-lg" />
                    <span className="font-bold text-xl tracking-tight">TaskiFy</span>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                        className="p-2 text-secondary-600 hover:bg-secondary-100 rounded-lg relative"
                    >
                        <Bell size={24} />
                        {unreadCount > 0 && (
                            <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full" />
                        )}
                    </button>
                    <button
                        onClick={() => setIsSidebarOpen(true)}
                        className="p-2 text-secondary-600 hover:bg-secondary-100 rounded-lg transition-colors"
                    >
                        <Menu size={24} />
                    </button>
                </div>
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
                                {filteredNavItems.map((item) => (
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
                    {filteredNavItems.map((item) => (
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

                <div className="mt-auto pt-6 border-t border-border">
                    <div className="flex items-center gap-3 mb-6 px-2">
                        <div className="w-10 h-10 rounded-full bg-secondary-100 flex items-center justify-center text-secondary-600 font-bold border-2 border-white shadow-sm ring-1 ring-secondary-200">
                            {user?.name?.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-secondary-900 truncate">{user?.name}</p>
                            <p className="text-xs text-secondary-500 truncate uppercase tracking-tighter">
                                {user?.role === 'SUPER_ADMIN' ? 'Admin' : 'Team Member'}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-secondary-600 hover:bg-red-50 hover:text-red-600 rounded-xl transition-all duration-200 group"
                    >
                        <LogOut size={18} className="group-hover:translate-x-0.5 transition-transform" />
                        <span className="font-medium">Logout</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="lg:pl-64 min-h-screen">
                {/* Header */}
                <header className="hidden lg:flex items-center justify-between px-8 py-4 bg-white/80 backdrop-blur-md border-b border-border sticky top-0 z-40">
                    <div className="flex items-center gap-4 bg-secondary-50 px-4 py-2 rounded-xl border border-secondary-200 w-96 group focus-within:ring-2 focus-within:ring-primary-500/20 transition-all">
                        <Search size={18} className="text-secondary-400" />
                        <input
                            type="text"
                            placeholder="Search projects, tasks..."
                            className="bg-transparent border-none outline-none text-sm w-full placeholder:text-secondary-400"
                        />
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <button
                                onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                                className="p-2.5 text-secondary-500 hover:bg-secondary-50 hover:text-primary-600 rounded-xl transition-all relative group"
                            >
                                <Bell size={20} />
                                {unreadCount > 0 && (
                                    <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 border-2 border-white rounded-full group-hover:scale-110 transition-transform" />
                                )}
                            </button>

                            {/* Notifications Dropdown */}
                            <AnimatePresence>
                                {isNotificationOpen && (
                                    <>
                                        <div
                                            className="fixed inset-0 z-40"
                                            onClick={() => setIsNotificationOpen(false)}
                                        />
                                        <motion.div
                                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                            className="absolute right-0 mt-3 w-80 bg-card rounded-2xl border border-border shadow-2xl z-50 overflow-hidden"
                                        >
                                            <div className="p-4 border-b border-border flex items-center justify-between bg-secondary-50/50">
                                                <h3 className="font-bold text-secondary-900">Notifications</h3>
                                                {unreadCount > 0 && (
                                                    <button
                                                        onClick={() => markAllRead.mutate()}
                                                        className="text-xs text-primary-600 hover:underline font-semibold"
                                                    >
                                                        Mark all as read
                                                    </button>
                                                )}
                                            </div>
                                            <div className="max-h-[380px] overflow-y-auto scrollbar-hide">
                                                {!notifications || notifications.length === 0 ? (
                                                    <div className="p-10 text-center">
                                                        <div className="w-12 h-12 bg-secondary-50 rounded-full flex items-center justify-center mx-auto mb-3">
                                                            <Bell size={20} className="text-secondary-300" />
                                                        </div>
                                                        <p className="text-sm text-secondary-500">No notifications yet</p>
                                                    </div>
                                                ) : (
                                                    notifications.map((n: any) => (
                                                        <div
                                                            key={n._id}
                                                            onClick={() => {
                                                                if (!n.read) markRead.mutate(n._id);
                                                                if (n.link) navigate(n.link);
                                                                setIsNotificationOpen(false);
                                                            }}
                                                            className={`p-4 border-b border-border hover:bg-secondary-50 cursor-pointer transition-colors relative group ${!n.read ? 'bg-primary-50/30' : ''}`}
                                                        >
                                                            {!n.read && <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary-600" />}
                                                            <p className={`text-sm mb-1 ${!n.read ? 'font-semibold text-secondary-900' : 'text-secondary-600'}`}>
                                                                {n.message}
                                                            </p>
                                                            <div className="flex items-center gap-2 text-xs text-secondary-400">
                                                                <Clock size={12} />
                                                                {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                            </div>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        </motion.div>
                                    </>
                                )}
                            </AnimatePresence>
                        </div>
                        <div className="w-px h-6 bg-border mx-2" />
                        <div className="flex items-center gap-3 pl-2">
                            <div className="text-right hidden sm:block">
                                <p className="text-sm font-bold text-secondary-900 leading-tight">{user?.name}</p>
                                <p className="text-[10px] text-secondary-500 uppercase tracking-widest font-bold">
                                    {user?.role === 'SUPER_ADMIN' ? 'Admin' : 'Team Member'}
                                </p>
                            </div>
                            <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center text-primary-600 font-bold border border-primary-100 shadow-sm">
                                {user?.name?.charAt(0)}
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
