import React, { useState, useRef, useLayoutEffect, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MoreVertical, LucideIcon } from 'lucide-react';

export interface ActionMenuItem {
    id: string;
    label: string;
    icon: LucideIcon;
    onClick: () => void;
    destructive?: boolean;
}

interface ActionMenuProps {
    items: ActionMenuItem[];
    className?: string;
}

const ActionMenu: React.FC<ActionMenuProps> = ({ items, className = '' }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [coords, setCoords] = useState<{ top: number; bottom: number; left: number; width: number; showAbove?: boolean } | null>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);

    useLayoutEffect(() => {
        if (isOpen && triggerRef.current) {
            const updateCoords = () => {
                const rect = triggerRef.current?.getBoundingClientRect();
                if (rect) {
                    const spaceBelow = window.innerHeight - rect.bottom;
                    const showAbove = spaceBelow < 200; // Action menu is usually smaller

                    const dropdownWidth = 180;
                    let left = rect.right - dropdownWidth; // Align to right of trigger
                    if (left < 16) left = 16;
                    if (left + dropdownWidth > window.innerWidth - 16) left = window.innerWidth - dropdownWidth - 16;

                    setCoords({
                        top: rect.top,
                        bottom: rect.bottom,
                        left: left,
                        width: dropdownWidth,
                        showAbove
                    });
                }
            };

            updateCoords();
            window.addEventListener('resize', updateCoords);
            window.addEventListener('scroll', updateCoords, true);
            return () => {
                window.removeEventListener('resize', updateCoords);
                window.removeEventListener('scroll', updateCoords, true);
            };
        } else {
            setCoords(null);
        }
    }, [isOpen]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (triggerRef.current && !triggerRef.current.contains(event.target as Node)) {
                const portals = document.getElementsByClassName('action-menu-portal');
                let clickedInsidePortal = false;
                for (let i = 0; i < portals.length; i++) {
                    if (portals[i].contains(event.target as Node)) clickedInsidePortal = true;
                }
                if (!clickedInsidePortal) setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="inline-block relative">
            <button
                ref={triggerRef}
                onClick={(e) => {
                    e.stopPropagation();
                    setIsOpen(!isOpen);
                }}
                className={`p-2 rounded-xl text-secondary-400 hover:text-secondary-600 hover:bg-secondary-100 transition-all ${isOpen ? 'bg-secondary-100 text-secondary-600' : ''} ${className}`}
            >
                <MoreVertical size={18} />
            </button>

            {isOpen && coords && createPortal(
                <div
                    className="action-menu-portal"
                    style={{
                        position: 'fixed',
                        top: coords.showAbove ? 'auto' : coords.bottom + 4,
                        bottom: coords.showAbove ? (window.innerHeight - coords.top) + 4 : 'auto',
                        left: coords.left,
                        width: coords.width,
                        zIndex: 2147483647,
                        pointerEvents: 'auto'
                    }}
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: coords.showAbove ? 10 : -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        className="bg-white border border-secondary-200 rounded-2xl shadow-[0_20px_70px_-10px_rgba(0,0,0,0.4)] overflow-hidden py-1.5"
                    >
                        {items.map((item) => (
                            <div
                                key={item.id}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    item.onClick();
                                    setIsOpen(false);
                                }}
                                className={`
                                    flex items-center gap-3 px-4 py-2.5 mx-1.5 rounded-xl cursor-pointer transition-all duration-200 group
                                    ${item.destructive
                                        ? 'text-rose-600 hover:bg-rose-50 hover:text-rose-700'
                                        : 'text-secondary-600 hover:bg-secondary-50 hover:text-secondary-900'
                                    }
                                `}
                            >
                                <item.icon size={16} className={item.destructive ? 'text-rose-500' : 'text-secondary-400 group-hover:text-secondary-600'} />
                                <span className="text-sm font-bold tracking-tight">{item.label}</span>
                            </div>
                        ))}
                    </motion.div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default ActionMenu;
