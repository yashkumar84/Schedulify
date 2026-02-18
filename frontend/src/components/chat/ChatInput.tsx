import React, { useState, KeyboardEvent } from 'react';
import { Send } from 'lucide-react';

interface ChatInputProps {
    onSendMessage: (content: string) => void;
    onTyping: () => void;
    disabled?: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, onTyping, disabled = false }) => {
    const [message, setMessage] = useState('');

    const handleSend = () => {
        if (message.trim() && !disabled) {
            onSendMessage(message);
            setMessage('');
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
            <div className="flex gap-2 items-end">
                <textarea
                    value={message}
                    onChange={handleChange}
                    onKeyPress={handleKeyPress}
                    placeholder="Type a message..."
                    disabled={disabled}
                    rows={1}
                    className="flex-1 px-4 py-2 bg-secondary-50 border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary-500 resize-none max-h-32 disabled:opacity-50"
                    style={{ minHeight: '40px', maxHeight: '128px' }}
                />
                <button
                    onClick={handleSend}
                    disabled={!message.trim() || disabled}
                    className="w-10 h-10 rounded-xl bg-primary-600 text-white flex items-center justify-center hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                >
                    <Send size={18} />
                </button>
            </div>
        </div>
    );
};

export default ChatInput;
