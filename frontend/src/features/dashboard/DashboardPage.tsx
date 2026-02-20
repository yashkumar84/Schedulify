import React from 'react';
import {
    Briefcase,
    CheckSquare,
    Clock,
    AlertCircle,
    TrendingUp,
    ArrowUpRight,
    Loader2
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useDashboardStats } from '../../hooks/useApi';

const StatCard: React.FC<{
    title: string;
    value: string | number;
    icon: any;
    color: string;
    trend?: string;
    delay: number;
}> = ({ title, value, icon: Icon, color, trend, delay }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay }}
        className="bg-card p-6 rounded-2xl border border-border shadow-sm hover:shadow-md transition-shadow"
    >
        <div className="flex items-center justify-between mb-4">
            <div className={`p-3 rounded-xl ${color} bg-opacity-10`}>
                <Icon className={`w-6 h-6 ${color.replace('bg-', 'text-')}`} />
            </div>
            {trend && (
                <span className="flex items-center text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                    <ArrowUpRight size={14} className="mr-1" />
                    {trend}
                </span>
            )}
        </div>
        <h3 className="text-secondary-500 text-sm font-medium">{title}</h3>
        <p className="text-2xl font-bold mt-1">{value}</p>
    </motion.div>
);

const DashboardPage: React.FC = () => {
    const { data: statsData, isLoading } = useDashboardStats();

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-10 h-10 text-primary-600 animate-spin" />
            </div>
        );
    }

    const stats = [
        { title: 'Total Projects', value: statsData?.totalProjects || 0, icon: Briefcase, color: 'bg-primary-500', trend: '+0%', delay: 0.1 },
        { title: 'Completed Tasks', value: statsData?.completedTasks || '0/0', icon: CheckSquare, color: 'bg-emerald-500', trend: '+0%', delay: 0.2 },
        { title: 'Budget Total', value: statsData?.totalBudget || '₹0', icon: TrendingUp, color: 'bg-amber-500', delay: 0.3 },
        { title: 'Overdue Tasks', value: statsData?.overdueTasks || 0, icon: AlertCircle, color: 'bg-red-500', delay: 0.4 },
    ];

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Dashboard Overview</h1>
                <p className="text-secondary-500 mt-1">Welcome back! Here's what's happening with your projects.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, index) => (
                    <StatCard key={index} {...stat} />
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Recent Activity */}
                <div className="lg:col-span-2 bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-border flex items-center justify-between">
                        <h2 className="font-bold text-lg">Recent Activity</h2>
                        <button className="text-primary-600 text-sm font-semibold hover:underline">View All</button>
                    </div>
                    <div className="divide-y divide-border">
                        {(!statsData?.recentActivity || statsData.recentActivity.length === 0) ? (
                            <div className="p-20 text-center text-secondary-500 font-medium">
                                <Clock className="w-12 h-12 mx-auto mb-4 opacity-20" />
                                No recent activity found.
                            </div>
                        ) : (
                            statsData.recentActivity.map((item: any, idx: number) => (
                                <div key={idx} className="p-4 sm:p-6 flex items-start gap-4 hover:bg-secondary-50 transition-colors">
                                    <div className="w-10 h-10 rounded-full bg-secondary-100 flex items-center justify-center flex-shrink-0">
                                        <Clock size={18} className="text-secondary-600" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium">
                                            <span className="text-foreground">{item.userName}</span> {item.action}
                                            <span className="text-primary-600 font-semibold cursor-pointer ml-1">{item.target}</span>
                                        </p>
                                        <p className="text-xs text-secondary-500 mt-1">{item.time} • {item.project}</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Project Progress */}
                <div className="bg-card rounded-2xl border border-border shadow-sm p-6">
                    <h2 className="font-bold text-lg mb-6">Active Projects</h2>
                    <div className="space-y-6">
                        {(!statsData?.activeProjects || statsData.activeProjects.length === 0) ? (
                            <div className="py-10 text-center text-secondary-500 text-sm">
                                No active projects to display.
                            </div>
                        ) : (
                            statsData.activeProjects.map((project: any, index: number) => (
                                <div key={index}>
                                    <div className="flex justify-between text-sm mb-2">
                                        <span className="font-medium text-secondary-900">{project.name}</span>
                                        <span className="text-secondary-500">{project.progress}%</span>
                                    </div>
                                    <div className="h-2 w-full bg-secondary-100 rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${project.progress}%` }}
                                            transition={{ duration: 1, delay: index * 0.1 }}
                                            className={`h-full ${project.color}`}
                                        />
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                    <button className="w-full mt-8 py-3 rounded-xl border border-primary-100 text-primary-600 font-semibold hover:bg-primary-50 transition-colors">
                        View Project Details
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DashboardPage;
