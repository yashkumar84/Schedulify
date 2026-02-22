import React from 'react';
import { motion } from 'framer-motion';
import {
    Plus,
    Edit2,
    Trash2,
    CheckCircle2,
    Clock,
    Briefcase
} from 'lucide-react';

interface Activity {
    _id: string;
    user: {
        name: string;
        role: string;
    };
    project?: {
        name: string;
    };
    action: string;
    entityType: string;
    entityName: string;
    description: string;
    createdAt: string;
}

const ActivityIcon = ({ action, entityType }: { action: string, entityType: string }) => {
    if (action === 'created') return <Plus size={16} className="text-emerald-500" />;
    if (action === 'updated') return <Edit2 size={16} className="text-primary-500" />;
    if (action === 'deleted') return <Trash2 size={16} className="text-rose-500" />;
    if (action === 'completed') return <CheckCircle2 size={16} className="text-emerald-500" />;

    if (entityType === 'PROJECT') return <Briefcase size={16} className="text-primary-500" />;
    if (entityType === 'TASK') return <CheckCircle2 size={16} className="text-amber-500" />;

    return <Clock size={16} className="text-secondary-400" />;
};

const ActivityFeed: React.FC<{ activities: Activity[], isLoading?: boolean }> = ({ activities, isLoading }) => {
    if (isLoading) {
        return (
            <div className="space-y-4">
                {[1, 2, 3].map(i => (
                    <div key={i} className="flex gap-4 animate-pulse">
                        <div className="w-10 h-10 rounded-full bg-secondary-100" />
                        <div className="flex-1 space-y-2 py-1">
                            <div className="h-4 bg-secondary-100 rounded w-3/4" />
                            <div className="h-3 bg-secondary-100 rounded w-1/2" />
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (!activities || activities.length === 0) {
        return (
            <div className="py-20 text-center container-sm">
                <div className="w-16 h-16 rounded-full bg-secondary-50 flex items-center justify-center mx-auto mb-4 border border-border">
                    <Clock className="text-secondary-300" size={32} />
                </div>
                <h3 className="text-lg font-bold text-secondary-900">No activity yet</h3>
                <p className="text-secondary-500 text-sm mt-1">Actions performed will appear here.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 relative before:absolute before:left-[19px] before:top-2 before:bottom-2 before:w-0.5 before:bg-secondary-100">
            {activities.map((activity, idx) => (
                <motion.div
                    key={activity._id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="flex gap-4 relative group"
                >
                    <div className={`
                        w-10 h-10 rounded-full border border-border flex items-center justify-center flex-shrink-0 z-10 transition-all duration-300
                        ${activity.action === 'created' ? 'bg-emerald-50 border-emerald-100' :
                            activity.action === 'deleted' ? 'bg-rose-50 border-rose-100' : 'bg-white'}
                    `}>
                        <ActivityIcon action={activity.action} entityType={activity.entityType} />
                    </div>

                    <div className="flex-1 min-w-0 pt-1">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
                            <p className="text-sm font-bold text-secondary-900 tracking-tight">
                                {activity.user?.name}
                                <span className="text-secondary-400 font-medium lowercase ml-1.5 mr-1.5">
                                    {activity.action}
                                </span>
                                <span className={`
                                    px-2 py-0.5 rounded-lg text-[10px] uppercase tracking-wider font-extrabold
                                    ${activity.entityType === 'PROJECT' ? 'bg-primary-50 text-primary-600' : 'bg-amber-50 text-amber-600'}
                                `}>
                                    {activity.entityType}
                                </span>
                            </p>
                            <span className="text-[10px] font-bold uppercase tracking-widest text-secondary-400">
                                {new Date(activity.createdAt).toLocaleDateString(undefined, {
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })}
                            </span>
                        </div>
                        <p className="text-sm text-secondary-600 font-medium">
                            {activity.entityName}
                            {activity.project && activity.entityType !== 'PROJECT' && (
                                <span className="text-secondary-400 ml-1.5 inline-flex items-center gap-1">
                                    in <span className="text-secondary-500 font-bold">{activity.project.name}</span>
                                </span>
                            )}
                        </p>
                        {activity.description && activity.description !== activity.entityName && (
                            <p className="text-xs text-secondary-400 mt-1 italic whitespace-pre-wrap">
                                "{activity.description}"
                            </p>
                        )}
                    </div>
                </motion.div>
            ))}
        </div>
    );
};

export default ActivityFeed;
