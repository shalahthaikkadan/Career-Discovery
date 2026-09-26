import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion as Motion } from 'framer-motion';
import { ArrowLeft, Clock, BookOpen, Send, Sparkles, User, Brain } from 'lucide-react';
import api from '../api';

const StepDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [step, setStep] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Chat States
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [sending, setSending] = useState(false);
    const chatEndRef = useRef(null);

    useEffect(() => {
        // Fetch step detail from API (triggers AI deep dive generation on-demand if missing)
        api.get(`/api/steps/${id}/`)
            .then((res) => {
                setStep(res.data);
                setMessages(res.data.chat_messages || []);
                setLoading(false);
            })
            .catch((err) => {
                console.error("Failed to fetch step details", err);
                setError("Failed to load step details. Please check your connection and try again.");
                setLoading(false);
            });
    }, [id]);

    useEffect(() => {
        // Scroll chat to bottom when messages update
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, sending]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim() || sending) return;

        const userMsg = input.trim();
        setInput('');
        setSending(true);

        // Optimistically add user message to list
        const tempUserMsg = {
            id: Date.now(),
            sender: 'user',
            text: userMsg,
            created_at: new Date().toISOString()
        };
        setMessages(prev => [...prev, tempUserMsg]);

        try {
            const res = await api.post(`/api/steps/${id}/chat/`, { text: userMsg });
            setMessages(res.data);
        } catch (err) {
            console.error("Chat failed", err);
            alert("Failed to send message. Please ensure the AI service is online and try again.");
            // Remove optimistic message if failed
            setMessages(prev => prev.filter(m => m.id !== tempUserMsg.id));
        } finally {
            setSending(false);
        }
    };

    const parseInlineBold = (text) => {
        const parts = text.split('**');
        return parts.map((part, i) => {
            if (i % 2 === 1) {
                return <strong key={i} className="font-black text-text">{part}</strong>;
            }
            return part;
        });
    };

    const renderMarkdown = (text) => {
        if (!text) return null;
        
        // Split text by blank lines (paragraphs / block elements)
        const blocks = text.split(/\n\s*\n/);
        
        return blocks.map((block, idx) => {
            const trimmedBlock = block.trim();
            if (!trimmedBlock) return null;

            // Code blocks
            if (trimmedBlock.startsWith('```')) {
                const lines = trimmedBlock.split('\n');
                const contentLines = lines.slice(1, lines[lines.length - 1].startsWith('```') ? -1 : undefined);
                return (
                    <pre key={idx} className="bg-surface border-4 border-text p-4 my-4 font-mono text-xs overflow-x-auto shadow-pop-sm rounded-pop text-left">
                        <code>{contentLines.join('\n')}</code>
                    </pre>
                );
            }

            // Headers
            if (trimmedBlock.startsWith('### ')) {
                return (
                    <h4 key={idx} className="text-lg font-black uppercase mt-6 mb-3 border-b-2 border-text pb-1 text-left">
                        {trimmedBlock.replace('### ', '')}
                    </h4>
                );
            }
            if (trimmedBlock.startsWith('## ')) {
                return (
                    <h3 key={idx} className="text-xl font-black uppercase mt-8 mb-4 border-b-4 border-text pb-2 text-left">
                        {trimmedBlock.replace('## ', '')}
                    </h3>
                );
            }
            if (trimmedBlock.startsWith('# ')) {
                return (
                    <h2 key={idx} className="text-2xl font-black uppercase mt-10 mb-6 border-b-4 border-text pb-2 text-left">
                        {trimmedBlock.replace('# ', '')}
                    </h2>
                );
            }

            // Unordered lists
            if (trimmedBlock.startsWith('- ') || trimmedBlock.startsWith('* ')) {
                const items = trimmedBlock.split('\n').map(i => i.trim()).filter(Boolean);
                return (
                    <ul key={idx} className="mb-4 text-left">
                        {items.map((item, itemIdx) => {
                            const cleanItem = item.replace(/^[-*]\s+/, '');
                            return (
                                <li key={itemIdx} className="ml-4 list-disc font-bold text-text-light mb-2 leading-relaxed text-sm sm:text-base">
                                    {parseInlineBold(cleanItem)}
                                </li>
                            );
                        })}
                    </ul>
                );
            }

            // Ordered lists
            if (trimmedBlock.match(/^\d+\.\s/)) {
                const items = trimmedBlock.split('\n').map(i => i.trim()).filter(Boolean);
                return (
                    <ol key={idx} className="mb-4 text-left">
                        {items.map((item, itemIdx) => {
                            const cleanItem = item.replace(/^\d+\.\s+/, '');
                            return (
                                <li key={itemIdx} className="ml-4 list-decimal font-bold text-text-light mb-2 leading-relaxed text-sm sm:text-base">
                                    {parseInlineBold(cleanItem)}
                                </li>
                            );
                        })}
                    </ol>
                );
            }

            // Standard Paragraph - collapse single newlines into spaces to allow text to flow naturally
            const collapsedText = trimmedBlock.replace(/\n+/g, ' ');
            return (
                <p key={idx} className="font-bold text-text-light mb-4 leading-relaxed text-sm sm:text-base text-left">
                    {parseInlineBold(collapsedText)}
                </p>
            );
        });
    };

    // Go back to the roadmap view cleanly, preserving the state (suggestion index) if possible
    const handleBack = () => {
        navigate(-1);
    };

    if (loading) {
        return (
            <div className="max-w-[1500px] mx-auto py-12 px-4 flex flex-col gap-8 items-center justify-center min-h-[70vh]">
                <Motion.div
                    animate={{ scale: [1, 1.05, 1], rotate: [0, 5, 0, -5, 0] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="flex items-center gap-3 bg-tertiary border-4 border-text px-8 py-4 font-black uppercase text-xl rotate-1 shadow-pop"
                >
                    <Sparkles size={24} /> Analyzing & Generating Study Guide...
                </Motion.div>
                
                {/* Visual Skeleton */}
                <div className="w-full flex flex-col lg:flex-row gap-8 items-stretch mt-8 animate-pulse">
                    <div className="w-full lg:w-1/2 pop-card bg-surface flex flex-col gap-4">
                        <div className="h-8 bg-text/20 w-3/4 rounded"></div>
                        <div className="h-6 bg-text/10 w-1/2 rounded"></div>
                        <div className="h-40 bg-text/5 w-full rounded mt-6"></div>
                        <div className="h-24 bg-text/5 w-full rounded"></div>
                    </div>
                    <div className="w-full lg:w-1/2 pop-card bg-surface flex flex-col justify-between">
                        <div className="h-6 bg-text/20 w-1/3 rounded"></div>
                        <div className="h-48 bg-text/5 w-full rounded my-6"></div>
                        <div className="h-12 bg-text/10 w-full rounded"></div>
                    </div>
                </div>
            </div>
        );
    }

    if (error || !step) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center gap-8 text-center px-4">
                <h1 className="pop-card text-3xl font-black uppercase bg-red-200 border-4 border-text shadow-pop">
                    {error || "STEP NOT FOUND"}
                </h1>
                <button onClick={handleBack} className="pop-button text-xl">Return to Roadmap</button>
            </div>
        );
    }

    return (
        <div className="max-w-[1500px] mx-auto pb-16 px-4 sm:px-6 relative">
            
            {/* Back Button */}
            <div className="mb-8">
                <button 
                    onClick={handleBack}
                    className="pop-button flex items-center gap-3 !px-6 !py-3 text-sm font-black uppercase shadow-pop-hover"
                >
                    <ArrowLeft size={18} strokeWidth={3} /> Return to Roadmap
                </button>
            </div>

            {/* Main Split-Screen Container */}
            <div className="flex flex-col lg:flex-row gap-8 items-stretch w-full min-h-[75vh]">
                
                {/* LEFT COLUMN: Study Guide / Deep Dive Details (55%) */}
                <div className="w-full lg:w-[55%] pop-card bg-bg border-4 border-text !p-8 shadow-pop flex flex-col">
                    
                    {/* Header Details */}
                    <div className="mb-6 border-b-4 border-text pb-6">
                        <div className="flex flex-wrap items-center gap-3 mb-4">
                            <span className="inline-block bg-primary border-2 border-text px-3 py-1 text-xs font-black uppercase shadow-pop-sm">
                                Milestone {step.order}
                            </span>
                            {step.duration && (
                                <span className="flex items-center gap-1.5 bg-surface border-2 border-text px-3 py-1 text-xs font-black uppercase shadow-pop-sm">
                                    <Clock size={14} /> {step.duration}
                                </span>
                            )}
                        </div>
                        
                        <h1 className="text-3xl sm:text-4xl font-black uppercase leading-tight tracking-tight">
                            {step.title}
                        </h1>
                    </div>

                    {/* Step Description & Key Resources */}
                    <div className="mb-8">
                        <h3 className="text-xs uppercase font-black tracking-widest opacity-50 mb-2">Step Summary</h3>
                        <p className="font-bold text-text-light text-lg leading-relaxed mb-6">
                            {step.description}
                        </p>

                        {step.resources && step.resources.length > 0 && (
                            <div className="bg-surface border-4 border-text p-6 rounded-pop">
                                <h4 className="text-xs font-black uppercase tracking-[0.2em] mb-3 opacity-60 flex items-center gap-2">
                                    <BookOpen size={14} /> Curated Resources
                                </h4>
                                <div className="flex flex-wrap gap-2">
                                    {step.resources.map((res, i) => (
                                        <div key={i} className="bg-bg border-2 border-text px-3 py-1.5 rounded-md text-xs font-black shadow-pop-sm">
                                            {res}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* AI Generated Study Guide (Deep Dive Content) */}
                    <div className="border-t-4 border-text pt-8 flex-1">
                        <h3 className="text-xs uppercase font-black tracking-widest opacity-50 mb-4 flex items-center gap-2">
                            <Sparkles size={14} /> AI Mentor Study Guide
                        </h3>
                        <div className="prose prose-stone max-w-none text-left">
                            {renderMarkdown(step.deep_dive)}
                        </div>
                    </div>
                </div>

                {/* RIGHT COLUMN: Interactive AI Mentor Chat (45%) */}
                <div className="w-full lg:w-[45%] pop-card bg-bg border-4 border-text !p-0 shadow-pop flex flex-col min-h-[550px] max-h-[85vh] lg:sticky lg:top-8 overflow-hidden">
                    
                    {/* Chat Header */}
                    <div className="bg-secondary border-b-4 border-text p-5 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-text text-bg flex items-center justify-center border-2 border-text shadow-pop-sm">
                            <Brain size={20} strokeWidth={2.5} />
                        </div>
                        <div>
                            <h2 className="font-black text-lg uppercase tracking-tight leading-none">AI Study Mentor</h2>
                            <span className="text-[10px] uppercase font-black tracking-wider opacity-60">Interactive Guidance for Step {step.order}</span>
                        </div>
                    </div>

                    {/* Conversation Message Area */}
                    <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 custom-scrollbar bg-surface/30">
                        {messages.length === 0 ? (
                            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-text-light">
                                <Sparkles size={36} className="text-primary mb-4 animate-bounce" />
                                <h3 className="font-black uppercase text-sm mb-2">Start a conversation</h3>
                                <p className="text-xs font-bold leading-relaxed max-w-xs">
                                    Ask any questions about this milestone. Request code snippets, seek clarifications, or ask how to build the recommended project!
                                </p>
                            </div>
                        ) : (
                            messages.map((msg) => (
                                <div 
                                    key={msg.id} 
                                    className={`flex items-start gap-3 max-w-[85%] ${
                                        msg.sender === 'user' ? 'self-end flex-row-reverse' : 'self-start'
                                    }`}
                                >
                                    {/* Avatar */}
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 border-text shadow-pop-sm flex-shrink-0 ${
                                        msg.sender === 'user' ? 'bg-primary' : 'bg-secondary'
                                    }`}>
                                        {msg.sender === 'user' ? <User size={14} /> : <Brain size={14} />}
                                    </div>
                                    
                                    {/* Bubble */}
                                    <div className={`p-4 border-2 border-text rounded-pop shadow-pop-sm text-sm font-bold leading-relaxed ${
                                        msg.sender === 'user' 
                                            ? 'bg-primary/20 text-right' 
                                            : 'bg-bg text-left prose prose-sm max-w-none'
                                    }`}>
                                        {msg.sender === 'user' ? msg.text : renderMarkdown(msg.text)}
                                    </div>
                                </div>
                            ))
                        )}

                        {sending && (
                            /* AI is typing indicator */
                            <div className="flex items-start gap-3 self-start">
                                <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center border-2 border-text shadow-pop-sm animate-pulse">
                                    <Brain size={14} />
                                </div>
                                <div className="bg-bg p-4 border-2 border-text rounded-pop shadow-pop-sm text-xs font-black uppercase tracking-wider flex items-center gap-2 animate-pulse">
                                    Mentor is thinking...
                                </div>
                            </div>
                        )}

                        <div ref={chatEndRef} />
                    </div>

                    {/* Chat Input Bar */}
                    <form onSubmit={handleSend} className="bg-bg border-t-4 border-text p-4 flex gap-3 items-center">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Ask follow-up questions about this step..."
                            className="flex-grow pop-input !py-3 !px-4 text-sm font-bold"
                            disabled={sending}
                        />
                        <button 
                            type="submit"
                            disabled={!input.trim() || sending}
                            className={`pop-button accent !p-3.5 flex items-center justify-center shadow-pop-sm ${
                                !input.trim() || sending ? 'opacity-50 cursor-not-allowed grayscale' : ''
                            }`}
                        >
                            <Send size={16} strokeWidth={3} />
                        </button>
                    </form>
                </div>

            </div>
        </div>
    );
};

export default StepDetail;
