import React, { useState, KeyboardEvent, useRef } from 'react';
import { Send, Paperclip, Loader2 } from 'lucide-react';

interface ChatInputProps {
    onSendMessage: (content: string, type?: string, metadata?: any) => void;
    onUploadFile: (file: File) => Promise<any>;
    onTyping: () => void;
    disabled?: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, onUploadFile, onTyping, disabled = false }) => {
    const [message, setMessage] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleSend = () => {
        if (message.trim() && !disabled) {
            onSendMessage(message);
            setMessage('');
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || disabled) return;

        setIsUploading(true);
        try {
            const data = await onUploadFile(file);
            onSendMessage(file.name, data.type, {
                fileName: data.fileName,
                fileUrl: data.url,
                fileSize: data.fileSize,
                mimetype: data.mimetype
            });
        } catch (error) {
            console.error('Upload failed:', error);
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleKeyPress = (e: KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setMessage(e.target.value);
        onTyping();
    };

    return (
        <div className="border-t border-border p-3 sm:p-4 bg-white/80 backdrop-blur-md relative overflow-hidden">
            {isUploading && (
                <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-10 flex items-center justify-center gap-2 animate-in fade-in duration-300">
                    <Loader2 className="animate-spin text-primary-600" size={18} />
                    <span className="text-xs font-bold text-primary-700 tracking-tight">Uploading secure attachment...</span>
                </div>
            )}

            <input
                type="file"
                className="hidden"
                ref={fileInputRef}
                onChange={handleFileChange}
            />

            <div className="flex gap-2 items-center">
                <div className="flex gap-1">
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={disabled || isUploading}
                        title="Attach File"
                        className="w-10 h-10 rounded-full hover:bg-secondary-100 text-secondary-500 flex items-center justify-center transition-all disabled:opacity-50 active:scale-95"
                    >
                        <Paperclip size={20} />
                    </button>
                </div>

                <div className="flex-1 bg-secondary-50 border border-secondary-200 rounded-[24px] px-4 py-1.5 focus-within:ring-2 focus-within:ring-primary-500/20 focus-within:border-primary-500 transition-all shadow-inner">
                    <textarea
                        value={message}
                        onChange={handleChange}
                        onKeyDown={handleKeyPress as any}
                        placeholder="Type a message..."
                        disabled={disabled || isUploading}
                        rows={1}
                        className="w-full bg-transparent border-none outline-none text-sm resize-none py-1.5 disabled:opacity-50 placeholder:text-secondary-400 font-medium"
                        style={{ minHeight: '32px', maxHeight: '120px' }}
                    />
                </div>

                <button
                    onClick={handleSend}
                    disabled={!message.trim() || disabled || isUploading}
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all transform active:scale-90 shadow-md ${!message.trim() || disabled || isUploading
                        ? 'bg-secondary-200 text-secondary-400 cursor-not-allowed'
                        : 'bg-primary-600 text-white hover:bg-primary-700 hover:shadow-lg'
                        }`}
                >
                    <Send size={18} />
                </button>
            </div>
        </div>
    );
};

export default ChatInput;
