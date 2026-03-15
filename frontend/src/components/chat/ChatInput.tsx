import React, { useState, KeyboardEvent, useRef, useEffect } from 'react';
import { Send, Paperclip, Loader2, Mic, Square } from 'lucide-react';

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

    // Voice recording state
    const [isRecording, setIsRecording] = useState(false);
    const [recordingSeconds, setRecordingSeconds] = useState(0);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const timerRef = useRef<number | null>(null);

    // Cleanup timer on unmount
    useEffect(() => {
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
            if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
                mediaRecorderRef.current.stop();
            }
        };
    }, []);

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
            alert('File upload failed. Please try again.');
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

    const startRecording = async () => {
        if (disabled || isUploading) return;
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
                ? 'audio/webm;codecs=opus'
                : MediaRecorder.isTypeSupported('audio/webm')
                    ? 'audio/webm'
                    : 'audio/ogg';

            const mediaRecorder = new MediaRecorder(stream, { mimeType });
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = async () => {
                // Stop all tracks to release microphone
                stream.getTracks().forEach(track => track.stop());

                const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });

                // If the blob is too small (< 100 bytes), it's likely a failed/empty recording
                if (audioBlob.size < 100) {
                    console.warn('Audio recording too short or empty');
                    setIsUploading(false);
                    return;
                }

                const ext = mimeType.includes('webm') ? 'webm' : 'ogg';
                const audioFile = new File([audioBlob], `voice-note.${ext}`, { type: mimeType });

                setIsUploading(true);
                try {
                    const data = await onUploadFile(audioFile);
                    onSendMessage('🎤 Voice message', 'audio', {
                        fileName: data.fileName || audioFile.name,
                        fileUrl: data.url,
                        fileSize: data.fileSize,
                        mimetype: mimeType,
                        duration: recordingSeconds
                    });
                } catch (err) {
                    console.error('Voice upload failed:', err);
                    alert('Failed to send voice message. Please try again.');
                } finally {
                    setIsUploading(false);
                }
            };

            mediaRecorder.start(100);
            setIsRecording(true);
            setRecordingSeconds(0);

            timerRef.current = window.setInterval(() => {
                setRecordingSeconds(prev => prev + 1);
            }, 1000);
        } catch (err) {
            console.error('Microphone permission denied:', err);
            alert('Microphone access is required to send voice messages.');
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
        }
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
        setIsRecording(false);
        setRecordingSeconds(0);
    };

    const cancelRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            // Prevent onstop from uploading by clearing chunks
            audioChunksRef.current = [];
            mediaRecorderRef.current.stop();
        }
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
        setIsRecording(false);
        setRecordingSeconds(0);
    };

    const formatTime = (secs: number) => {
        const m = Math.floor(secs / 60).toString().padStart(2, '0');
        const s = (secs % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    return (
        <div className="border-t border-border p-3 sm:p-4 bg-white/80 backdrop-blur-md relative overflow-hidden">
            {isUploading && (
                <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-10 flex items-center justify-center gap-2 animate-in fade-in duration-300">
                    <Loader2 className="animate-spin text-primary-600" size={18} />
                    <span className="text-xs font-bold text-primary-700 tracking-tight">Sending...</span>
                </div>
            )}

            <input
                type="file"
                className="hidden"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*,video/*,application/pdf,.doc,.docx,.txt,.zip"
            />

            {/* Recording indicator bar */}
            {isRecording && (
                <div className="flex items-center gap-3 mb-3 px-2 py-2 bg-red-50 border border-red-200 rounded-xl">
                    <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse shrink-0" />
                    <span className="text-sm font-bold text-red-600 flex-1">Recording... {formatTime(recordingSeconds)}</span>
                    <button
                        onClick={cancelRecording}
                        className="text-xs text-secondary-500 hover:text-secondary-700 font-semibold px-2 py-1 rounded-lg hover:bg-secondary-100 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={stopRecording}
                        title="Stop & Send"
                        className="w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-all active:scale-90 shadow-md"
                    >
                        <Square size={12} fill="white" />
                    </button>
                </div>
            )}

            <div className="flex gap-2 items-center">
                {!isRecording && (
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
                )}

                {!isRecording && (
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
                )}

                {/* Send / Mic button — show mic when no text, show send when there's text */}
                {!isRecording && message.trim() ? (
                    <button
                        onClick={handleSend}
                        disabled={disabled || isUploading}
                        className="w-10 h-10 rounded-full flex items-center justify-center transition-all transform active:scale-90 shadow-md bg-primary-600 text-white hover:bg-primary-700 hover:shadow-lg"
                    >
                        <Send size={18} />
                    </button>
                ) : !isRecording ? (
                    <button
                        type="button"
                        onClick={startRecording}
                        disabled={disabled || isUploading}
                        title="Hold to record voice message"
                        className="w-10 h-10 rounded-full flex items-center justify-center transition-all transform active:scale-90 shadow-md bg-secondary-100 text-secondary-500 hover:bg-primary-100 hover:text-primary-600 disabled:opacity-50"
                    >
                        <Mic size={18} />
                    </button>
                ) : null}
            </div>
        </div>
    );
};

export default ChatInput;
