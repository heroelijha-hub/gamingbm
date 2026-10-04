'use client';

import { useState, useEffect, useRef } from 'react';
import { getOrCreateSession, sendMessage, getSessionMessages } from '@/actions/chat';
import { ChatSender, ChatMessage } from '@prisma/client';
import { useTranslations } from 'next-intl';
import { useCartStore } from '@/store/cartStore';
import { useWishlistStore } from '@/store/wishlistStore';
import { usePathname } from 'next/navigation';
import Image from "next/image";

function generateId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

interface ChatWidgetProps {
  enabled: boolean;
  storeName: string;
  storeIcon: string;
}

export default function ChatWidget({ enabled, storeName, storeIcon }: ChatWidgetProps) {
  const t = useTranslations('ChatWidget');
  const [isOpen, setIsOpen] = useState(false);
  const [guestId, setGuestId] = useState<string>('');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const pathname = usePathname();
  const isCartDrawerOpen = useCartStore((state) => state.isOpen);
  const isWishlistDrawerOpen = useWishlistStore((state) => state.isOpen);
  const [newMessage, setNewMessage] = useState('');
  const [hasRegistered, setHasRegistered] = useState(false);
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!enabled) return;
    
    let id = localStorage.getItem('chat_guest_id');
    if (!id) {
      id = generateId();
      localStorage.setItem('chat_guest_id', id);
    }
    
    if (guestId !== id) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setGuestId(id);
    }

    const savedName = localStorage.getItem('chat_guest_name');
    const savedEmail = localStorage.getItem('chat_guest_email');

    if (savedName && savedEmail) {
      setHasRegistered(true);
      setGuestName(savedName);
      setGuestEmail(savedEmail);
    }

    const initChat = async () => {
      try {
        const session = await getOrCreateSession(id as string, savedName || undefined, savedEmail || undefined);
        setSessionId(session.id);
        const msgs = await getSessionMessages(session.id, id as string);
        setMessages(msgs);
      } catch (err) {
        console.error("Failed to init chat session:", err);
        // If it fails (e.g., db schema mismatch), reset so they aren't stuck in an invisible broken state
        setSessionId(null);
      }
    };

    if (savedName && savedEmail) {
      initChat();
    }
  }, [enabled, guestId]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName.trim() || !guestEmail.trim()) return;
    
    localStorage.setItem('chat_guest_name', guestName);
    localStorage.setItem('chat_guest_email', guestEmail);
    setHasRegistered(true);
    
    if (guestId) {
      try {
        const session = await getOrCreateSession(guestId, guestName, guestEmail);
        setSessionId(session.id);
        const msgs = await getSessionMessages(session.id, guestId);
        setMessages(msgs);
      } catch (err) {
        console.error("Failed to create session on register:", err);
        setSessionId(null);
        alert(t('connection_error'));
      }
    }
  };

  // Polling for new messages when open
  useEffect(() => {
    if (!isOpen || !sessionId) return;
    
    const interval = setInterval(async () => {
      const msgs = await getSessionMessages(sessionId, guestId as string);
      if (msgs.length > messages.length) {
        setMessages(msgs);
      }
    }, 3000); // Poll every 3 seconds
    
    return () => clearInterval(interval);
  }, [isOpen, sessionId, messages.length]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !sessionId) return;
    
    const tempMsg = {
      id: 'temp-' + Date.now(),
      sessionId,
      sender: ChatSender.CUSTOMER,
      content: newMessage,
      createdAt: new Date(),
    } as ChatMessage;
    
    setMessages([...messages, tempMsg]);
    setNewMessage('');
    
    const savedMsg = await sendMessage(sessionId, ChatSender.CUSTOMER, tempMsg.content);
    setMessages(prev => prev.map(m => m.id === tempMsg.id ? savedMsg : m));
  };

  if (!enabled) return null;

  const isCheckoutOrCart = pathname?.includes('/checkout') || pathname?.includes('/cart');
  const isAnyDrawerOpen = isCartDrawerOpen || isWishlistDrawerOpen;

  let visibilityClasses = '';
  if (isAnyDrawerOpen) {
    visibilityClasses = 'hidden';
  } else if (isCheckoutOrCart) {
    visibilityClasses = 'hidden lg:block';
  }

  return (
    <div className={`fixed bottom-24 lg:bottom-6 right-6 z-50 font-sans ${visibilityClasses}`}>
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          aria-label={t('open_chat') || "Open Chat"}
          className="bg-orange-600 hover:bg-orange-700 text-white rounded-full p-4 shadow-lg transition-transform hover:scale-105 flex items-center justify-center"
        >
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
        </button>
      )}

      {isOpen && (
        <div className="bg-white w-80 sm:w-96 rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-100" style={{ height: '500px', maxHeight: '80vh' }}>
          {/* Header */}
          <div className="bg-orange-600 p-4 text-white flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center overflow-hidden border-2 border-orange-400">
                {storeIcon ? (
                  <Image width={800} height={800} src={storeIcon} alt="Store Icon" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-orange-700 font-bold text-xl">{storeName.charAt(0)}</span>
                )}
              </div>
              <div>
                <h3 className="font-bold leading-tight">{storeName}</h3>
                <p className="text-xs text-orange-200">{t('we_reply_quickly')}</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-orange-100 hover:text-white transition">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          {/* Body */}
          {!hasRegistered ? (
            <div className="flex-1 p-6 bg-gray-50 flex flex-col justify-center">
              <h4 className="font-bold text-gray-800 mb-2">{t('welcome')}</h4>
              <p className="text-sm text-gray-600 mb-4">{t('please_enter_details')}</p>
              <form onSubmit={handleRegister} className="flex flex-col gap-3">
                <input
                  type="text"
                  required
                  placeholder={t('your_name')}
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-orange-500 text-sm"
                />
                <input
                  type="email"
                  required
                  placeholder={t('your_email')}
                  value={guestEmail}
                  onChange={(e) => setGuestEmail(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-orange-500 text-sm"
                />
                <button
                  type="submit"
                  className="w-full bg-orange-600 text-white font-semibold py-2 rounded-md hover:bg-orange-700 transition mt-2"
                >
                  {t('start_chat')}
                </button>
              </form>
            </div>
          ) : (
            <>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 bg-gray-50 flex flex-col gap-3">
                {messages.length === 0 && (
                  <div className="text-center text-gray-500 text-sm mt-8">
                    {t('send_message_prompt')}
                  </div>
                )}
                {messages.map((msg) => {
                  const isCustomer = msg.sender === ChatSender.CUSTOMER;
                  return (
                    <div key={msg.id} className={`flex flex-col ${isCustomer ? 'items-end' : 'items-start'}`}>
                      <div className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm shadow-sm ${
                        isCustomer ? 'bg-orange-600 text-white rounded-br-none' : 'bg-white text-gray-800 border border-gray-100 rounded-bl-none'
                      }`}>
                        {msg.content}
                      </div>
                      <span className="text-[10px] text-gray-500 mt-1 px-1">
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="p-3 bg-white border-t border-gray-100">
                <form onSubmit={handleSend} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder={t('your_message')}
                    className="flex-1 bg-gray-50 border border-gray-200 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition"
                  />
                  <button
                    type="submit"
                    disabled={!newMessage.trim()}
                    className="bg-orange-600 text-white p-2 rounded-full hover:bg-orange-700 disabled:opacity-50 disabled:hover:bg-orange-600 transition flex items-center justify-center"
                  >
                    <svg className="w-5 h-5 rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                  </button>
                </form>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
