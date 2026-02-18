import React from 'react';
import { Users } from 'lucide-react';

interface OnlineUser {
    userId: string;
    userName: string;
    userRole: string;
}

interface OnlineUsersProps {
    users: OnlineUser[];
}

const OnlineUsers: React.FC<OnlineUsersProps> = ({ users }) => {
    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    const getRoleColor = (role: string) => {
        switch (role) {
            case 'SUPER_ADMIN':
                return 'bg-rose-100 text-rose-600';
            case 'PROJECT_MANAGER':
                return 'bg-blue-100 text-blue-600';
            case 'FINANCE_TEAM':
                return 'bg-green-100 text-green-600';
            default:
                return 'bg-secondary-100 text-secondary-600';
        }
    };

    if (users.length === 0) {
        return null;
    }

    return (
        <div className="border-b border-border p-3 bg-secondary-50">
            <div className="flex items-center gap-2 mb-2">
                <Users size={14} className="text-secondary-500" />
                <span className="text-xs font-semibold text-secondary-600 uppercase tracking-wide">
                    Online ({users.length})
                </span>
            </div>
            <div className="flex flex-wrap gap-2">
                {users.map((user) => (
                    <div
                        key={user.userId}
                        className="flex items-center gap-1.5 bg-white px-2 py-1 rounded-lg border border-border"
                    >
                        <div className={`w-6 h-6 rounded-full ${getRoleColor(user.userRole)} flex items-center justify-center text-[10px] font-bold relative`}>
                            {getInitials(user.userName)}
                            <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full"></div>
                        </div>
                        <span className="text-xs font-medium text-secondary-700">{user.userName}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default OnlineUsers;
