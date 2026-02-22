import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { format, addDays, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, differenceInDays } from 'date-fns';
import { Clock, CheckCircle2, AlertCircle } from 'lucide-react';

interface Task {
    _id: string;
    title: string;
    startDate: string;
    dueDate: string;
    status: string;
    priority: string;
}

const ProjectTimeline: React.FC<{ tasks: Task[] }> = ({ tasks }) => {
    // Determine the date range for the timeline
    const timelineRange = useMemo(() => {
        if (!tasks || tasks.length === 0) return null;

        const allDates = tasks.flatMap(t => [
            t.startDate ? new Date(t.startDate) : new Date(),
            t.dueDate ? new Date(t.dueDate) : new Date()
        ]).filter(d => !isNaN(d.getTime()));

        if (allDates.length === 0) return null;

        const minDate = startOfMonth(new Date(Math.min(...allDates.map(d => d.getTime()))));
        const maxDate = endOfMonth(new Date(Math.max(...allDates.map(d => d.getTime()))));

        // Ensure at least 30 days view
        const rangeMax = differenceInDays(maxDate, minDate) < 30 ? addDays(minDate, 30) : maxDate;

        return {
            start: minDate,
            end: rangeMax,
            days: eachDayOfInterval({ start: minDate, end: rangeMax })
        };
    }, [tasks]);

    if (!timelineRange) {
        return (
            <div className="py-20 text-center bg-card rounded-2xl border border-border">
                <p className="text-secondary-500 font-medium">No schedule data available for this project's tasks.</p>
            </div>
        );
    }

    const { days, start } = timelineRange;
    const dayWidth = 40; // px per day

    return (
        <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden flex flex-col">
            <div className="p-6 border-b border-border flex items-center justify-between">
                <div>
                    <h3 className="text-xl font-bold">Project Timeline</h3>
                    <p className="text-sm text-secondary-500 mt-1">Gantt view of tasks and milestones</p>
                </div>
            </div>

            <div className="overflow-x-auto relative hide-scrollbar" style={{ minHeight: '400px' }}>
                {/* Timeline Header (Dates) */}
                <div className="flex border-b border-border sticky top-0 bg-white z-20 min-w-max">
                    <div className="w-64 flex-shrink-0 p-4 border-r border-border bg-secondary-50 font-bold text-xs uppercase text-secondary-500">
                        Tasks
                    </div>
                    {days.map((day, i) => (
                        <div
                            key={i}
                            className={`flex-shrink-0 p-2 text-center border-r border-border/50 text-[10px] font-bold ${day.getDay() === 0 || day.getDay() === 6 ? 'bg-secondary-50' : ''
                                }`}
                            style={{ width: dayWidth }}
                        >
                            <div className="text-secondary-400 uppercase">{format(day, 'EEE')}</div>
                            <div className={isSameDay(day, new Date()) ? 'text-primary-600 font-extrabold' : 'text-secondary-600'}>
                                {format(day, 'd')}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Timeline Rows */}
                <div className="min-w-max pb-8">
                    {tasks.map((task) => {
                        const taskStart = task.startDate ? new Date(task.startDate) : start;
                        const taskEnd = task.dueDate ? new Date(task.dueDate) : taskStart;

                        const leftOffset = differenceInDays(taskStart, start) * dayWidth;
                        const duration = Math.max(1, differenceInDays(taskEnd, taskStart) + 1);
                        const width = duration * dayWidth;

                        return (
                            <div key={task._id} className="flex border-b border-border/30 group hover:bg-secondary-50/50 transition-colors relative">
                                {/* Task Name Label */}
                                <div className="w-64 flex-shrink-0 p-4 border-r border-border flex items-center gap-2 z-10 bg-white group-hover:bg-secondary-50/50">
                                    <div className={`w-2 h-2 rounded-full ${task.status === 'COMPLETED' ? 'bg-emerald-500' :
                                            task.status === 'IN_PROGRESS' ? 'bg-primary-500' : 'bg-secondary-300'
                                        }`} />
                                    <span className="text-sm font-bold text-secondary-700 truncate">{task.title}</span>
                                </div>

                                {/* Task Bar Container */}
                                <div className="flex-1 relative h-14">
                                    {/* Grid Lines Overlay */}
                                    <div className="absolute inset-0 flex">
                                        {days.map((day, i) => (
                                            <div
                                                key={i}
                                                className={`h-full border-r border-border/20 ${day.getDay() === 0 || day.getDay() === 6 ? 'bg-secondary-50/30' : ''
                                                    }`}
                                                style={{ width: dayWidth }}
                                            />
                                        ))}
                                    </div>

                                    {/* The Task Bar */}
                                    <motion.div
                                        initial={{ opacity: 0, x: leftOffset - 20 }}
                                        animate={{ opacity: 1, x: leftOffset }}
                                        className={`absolute h-8 top-3 rounded-xl shadow-md flex items-center px-3 z-10 cursor-pointer overflow-hidden whitespace-nowrap text-[10px] font-extrabold uppercase tracking-tight text-white ${task.status === 'COMPLETED' ? 'bg-emerald-500 shadow-emerald-500/20' :
                                                task.status === 'IN_PROGRESS' ? 'bg-primary-600 shadow-primary-600/20' :
                                                    'bg-secondary-400 shadow-secondary-400/20'
                                            }`}
                                        style={{ width }}
                                    >
                                        {task.status === 'COMPLETED' ? <CheckCircle2 size={12} className="mr-1 shadow-sm" /> : <Clock size={12} className="mr-1 shadow-sm" />}
                                        <span className="truncate">{task.title}</span>
                                    </motion.div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="p-4 border-t border-border bg-secondary-50 flex items-center gap-6 justify-center">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-emerald-500" />
                    <span className="text-[10px] font-bold text-secondary-500 uppercase tracking-widest">Completed</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-primary-600" />
                    <span className="text-[10px] font-bold text-secondary-500 uppercase tracking-widest">In Progress</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-secondary-400" />
                    <span className="text-[10px] font-bold text-secondary-500 uppercase tracking-widest">Upcoming</span>
                </div>
            </div>
        </div>
    );
};

export default ProjectTimeline;
