import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Check, Search, LucideIcon } from 'lucide-react';

export interface SelectOption {
    id: string;
    label: string;
    icon?: LucideIcon;
    color?: string;
    bg?: string;
}

interface CustomSelectProps {
    options: SelectOption[];
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    label?: string;
    disabled?: boolean;
    className?: string;
    searchable?: boolean;
}

const CustomSelect: React.FC<CustomSelectProps> = ({
    options,
    value,
    onChange,
    placeholder = 'Select an option',
    label,
    disabled = false,
    className = '',
    searchable = false
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [coords, setCoords] = useState<{ top: number; bottom: number; left: number; width: number; showAbove?: boolean } | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const selectedOption = options.find(opt => opt.id === value);

    useLayoutEffect(() => {
        if (isOpen && containerRef.current) {
            const updateCoords = () => {
                const rect = containerRef.current?.getBoundingClientRect();
                if (rect) {
                    const spaceBelow = window.innerHeight - rect.bottom;
                    const showAbove = spaceBelow < 350 && rect.top > 350;

                    // Edge detection: Ensure dropdown doesn't go off-screen horizontally
                    const dropdownWidth = Math.max(rect.width, 240);
                    let left = rect.left;
                    if (left + dropdownWidth > window.innerWidth) {
                        left = window.innerWidth - dropdownWidth - 16;
                    }
                    if (left < 16) left = 16;

                    setCoords({
                        top: rect.top,
                        bottom: rect.bottom,
                        left: left,
                        width: rect.width,
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
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                const portals = document.getElementsByClassName('select-portal');
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

    const filteredOptions = options.filter(opt =>
        opt.label.toLowerCase().includes(searchQuery.toLowerCase())
    );

    useEffect(() => {
        if (isOpen && searchable && inputRef.current) {
            inputRef.current.focus();
        }
        if (!isOpen) {
            setSearchQuery('');
        }
    }, [isOpen, searchable]);

    return (
        <div className={`relative ${className}`} ref={containerRef}>
            {label && (
                <label className="block text-[11px] font-bold text-secondary-500 uppercase tracking-widest mb-1.5 ml-1">
                    {label}
                </label>
            )}

            <button
                type="button"
                disabled={disabled}
                onClick={() => setIsOpen(!isOpen)}
                className={`
                    w-full flex items-center justify-between gap-3 px-4 py-3 bg-white border border-secondary-200 rounded-2xl
                    hover:border-primary-400 hover:shadow-md transition-all duration-300 group
                    ${isOpen ? 'border-primary-500 ring-4 ring-primary-500/10 shadow-lg' : 'shadow-sm'}
                    ${disabled ? 'opacity-50 cursor-not-allowed bg-secondary-50' : 'cursor-pointer'}
                `}
            >
                <div className="flex items-center gap-2.5 overflow-hidden">
                    {selectedOption?.icon && (
                        <div className={`p-1.5 rounded-lg ${selectedOption.bg || 'bg-primary-50'} ${selectedOption.color || 'text-primary-600'}`}>
                            <selectedOption.icon size={16} />
                        </div>
                    )}
                    <span className={`text-sm font-semibold truncate ${selectedOption ? 'text-secondary-900' : 'text-secondary-400'}`}>
                        {selectedOption ? selectedOption.label : placeholder}
                    </span>
                </div>
                <ChevronDown
                    size={18}
                    className={`text-secondary-400 transition-transform duration-500 ease-out ${isOpen ? 'rotate-180 text-primary-500' : ''}`}
                />
            </button>

            {isOpen && coords && createPortal(
                <div
                    className="select-portal"
                    style={{
                        position: 'fixed',
                        top: coords.showAbove ? 'auto' : coords.bottom + 4,
                        bottom: coords.showAbove ? (window.innerHeight - coords.top) + 4 : 'auto',
                        left: coords.left,
                        width: Math.max(coords.width, 240),
                        zIndex: 2147483647,
                        pointerEvents: 'auto'
                    }}
                >
                    <div className="bg-white border border-secondary-200 rounded-2xl shadow-[0_20px_70px_-10px_rgba(0,0,0,0.4)] overflow-hidden">
                        {searchable && (
                            <div className="p-3 border-b border-secondary-100 relative bg-secondary-50/50">
                                <Search size={14} className="absolute left-6 top-1/2 -translate-y-1/2 text-secondary-400" />
                                <input
                                    ref={inputRef}
                                    type="text"
                                    placeholder="Search..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-9 pr-4 py-2 bg-white border border-secondary-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500/20 outline-none transition-all"
                                />
                            </div>
                        )}

                        <div className="max-h-[300px] overflow-y-auto py-2 hide-scrollbar">
                            {filteredOptions.length === 0 ? (
                                <div className="px-4 py-8 text-center text-sm text-secondary-400 italic">
                                    No options found
                                </div>
                            ) : (
                                filteredOptions.map((option) => (
                                    <div
                                        key={option.id}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onChange(option.id);
                                            setIsOpen(false);
                                        }}
                                        className={`
                                            flex items-center gap-3 px-4 py-2.5 mx-2 rounded-xl cursor-pointer transition-all duration-200 group
                                            ${value === option.id
                                                ? 'bg-primary-50 text-primary-700'
                                                : 'text-secondary-600 hover:bg-secondary-50 hover:text-secondary-900'
                                            }
                                        `}
                                    >
                                        <div className={`p-2 rounded-lg transition-transform duration-300 group-hover:scale-110 ${option.bg || 'bg-secondary-100'} ${option.color || 'text-secondary-600'}`}>
                                            {option.icon && <option.icon size={16} />}
                                        </div>
                                        <span className="flex-1 text-sm font-bold tracking-tight">{option.label}</span>
                                        {value === option.id && (
                                            <Check size={16} className="text-primary-600" />
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default CustomSelect;
