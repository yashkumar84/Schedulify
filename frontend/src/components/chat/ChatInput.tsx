import React, { useState, KeyboardEvent } from 'react';
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
    const fileInputRef = React.useRef<HTMLInputElement>(null);

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
            // Send as message immediately or could wait for user to hit send
            onSendMessage(file.name, data.type, {
                fileName: data.fileName,
                fileUrl: data.url,
                fileSize: data.fileSize,
                mimetype: data.mimetype
            });
        } catch (error) {
            alert('Failed to upload file');
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
        <div className="border-t border-border p-4 bg-card">
            <input
                type="file"
                className="hidden"
                ref={fileInputRef}
                onChange={handleFileChange}
            />
            <div className="flex gap-2 items-end">
                <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={disabled || isUploading}
                    className="w-10 h-10 rounded-xl hover:bg-secondary-50 text-secondary-500 flex items-center justify-center transition-colors disabled:opacity-50 flex-shrink-0"
                >
                    {isUploading ? <Loader2 size={18} className="animate-spin text-primary-600" /> : <Paperclip size={18} />}
                </button>
                <textarea
                    value={message}
                    onChange={handleChange}
                    onKeyPress={handleKeyPress}
                    placeholder="Type a message..."
                    disabled={disabled || isUploading}
                    rows={1}
                    className="flex-1 px-4 py-2 bg-secondary-50 border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary-500 resize-none max-h-32 disabled:opacity-50"
                    style={{ minHeight: '40px', maxHeight: '128px' }}
                />
                <button
                    onClick={handleSend}
                    disabled={!message.trim() || disabled || isUploading}
                    className="w-10 h-10 rounded-xl bg-primary-600 text-white flex items-center justify-center hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                >
                    <Send size={18} />
                </button>
            </div>
        </div>
    );
};

export default ChatInput;
