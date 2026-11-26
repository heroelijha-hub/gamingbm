'use client';

import { useState, useEffect, useRef } from 'react';
import {
  getAdminSessions,
  sendAdminMessage,
  closeSession,
  getAdminSessionMessages,
  toggleSessionCustomerImages,
  uploadChatImage
} from '@/actions/chat';
import { ChatSender, ChatMessage } from '@prisma/client';
import { useTranslations, useLocale } from 'next-intl';

export default function AdminChatClient({ initialSessions }: { initialSessions: any[] }) {
  const t = useTranslations('AdminChat');
  const locale = useLocale();
  const [sessions, setSessions] = useState<any[]>(initialSessions);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeSession = sessions.find(s => s.id === activeSessionId);

  // Poll for sessions (left sidebar)
  useEffect(() => {
    const interval = setInterval(async () => {
      const freshSessions = await getAdminSessions();
      setSessions(freshSessions);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Fetch and poll messages for active session
  useEffect(() => {
    if (!activeSessionId) return;

    const fetchMessages = async () => {
      const msgs = await getAdminSessionMessages(activeSessionId);
      setMessages(msgs);
    };

    fetchMessages();
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [activeSessionId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("L'image ne doit pas dépasser 5 Mo.");
        return;
      }
      setSelectedFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleRemoveImage = () => {
    setSelectedFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleToggleCustomerImages = async () => {
    if (!activeSessionId || !activeSession) return;
    const nextVal = !activeSession.allowCustomerImages;
    try {
      await toggleSessionCustomerImages(activeSessionId, nextVal);
      setSessions(prev =>
        prev.map(s => (s.id === activeSessionId ? { ...s, allowCustomerImages: nextVal } : s))
      );
    } catch (err) {
      console.error('Failed to toggle customer images', err);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(e);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!newMessage.trim() && !selectedFile) || !activeSessionId || isUploading) return;

    let uploadedImageUrl: string | undefined = undefined;
    if (selectedFile) {
      setIsUploading(true);
      try {
        const formData = new FormData();
        formData.append('file', selectedFile);
        const res = await uploadChatImage(formData, activeSessionId);
        uploadedImageUrl = res.url;
      } catch (err: any) {
        alert(err.message || "Erreur lors de l'envoi de l'image");
        setIsUploading(false);
        return;
      }
      setIsUploading(false);
    }

    const messageContent = newMessage;
    const tempMsg = {
      id: 'temp-' + Date.now(),
      sessionId: activeSessionId,
      sender: ChatSender.ADMIN,
      content: messageContent,
      imageUrl: uploadedImageUrl || null,
      createdAt: new Date(),
    };

    setMessages(prev => [...prev, tempMsg]);
    setNewMessage('');
    handleRemoveImage();

    try {
      const savedMsg = await sendAdminMessage(activeSessionId, messageContent, uploadedImageUrl);
      setMessages(prev => prev.map(m => (m.id === tempMsg.id ? savedMsg : m)));
    } catch (e) {
      console.error('Failed to send admin message', e);
    }
  };

  const handleClose = async () => {
    if (!activeSessionId) return;
    if (confirm(t('confirm_close'))) {
      await closeSession(activeSessionId);
      setActiveSessionId(null);
      setSessions(await getAdminSessions());
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex h-full min-h-0">
      {/* Sidebar: Sessions List */}
      <div className="w-1/3 min-w-[260px] max-w-[340px] border-r border-gray-200 flex flex-col bg-gray-50 h-full min-h-0 flex-shrink-0">
        <div className="p-3.5 sm:p-4 border-b border-gray-200 bg-white flex-shrink-0">
          <h2 className="font-bold text-gray-900 text-sm sm:text-base">{t('active_conversations')}</h2>
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto">
          {sessions.map((s) => (
            <button
              key={s.id}
              onClick={() => setActiveSessionId(s.id)}
              className={`w-full text-left p-3.5 border-b border-gray-100 hover:bg-orange-50/70 transition ${activeSessionId === s.id ? 'bg-orange-100/80 border-orange-200' : ''}`}
            >
              <div className="flex justify-between items-center mb-1">
                <span className="font-medium text-sm text-gray-900 truncate pr-2">
                  {s.guestName ? s.guestName : `${t('guest')} ${s.guestId.substring(0, 6)}`}
                </span>
                <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${s.status === 'OPEN' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-200 text-gray-700'}`}>
                  {s.status}
                </span>
              </div>
              {s.guestEmail && (
                <p className="text-xs text-orange-700 mb-1 truncate">{s.guestEmail}</p>
              )}
              <div className="flex items-center gap-1.5 text-xs text-gray-500 truncate">
                {s.allowCustomerImages && (
                  <span className="inline-block px-1.5 py-0.2 text-[10px] bg-blue-100 text-blue-700 rounded font-medium flex-shrink-0">
                    Photos
                  </span>
                )}
                <span className="truncate">
                  {s.messages?.[0]?.content || (s.messages?.[0]?.imageUrl ? '📷 [Image]' : t('no_messages'))}
                </span>
              </div>
            </button>
          ))}
          {sessions.length === 0 && (
            <div className="p-6 text-sm text-gray-500 text-center">{t('no_conversations')}</div>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-white h-full min-h-0 min-w-0">
        {activeSessionId ? (
          <>
            {/* Chat Header */}
            <div className="p-3.5 sm:p-4 border-b border-gray-200 flex justify-between items-center bg-white gap-3 flex-shrink-0 shadow-sm z-10">
              <div className="min-w-0">
                <h3 className="font-bold text-gray-900 truncate text-base">
                  {activeSession?.guestName || t('guest')}
                </h3>
                {activeSession?.guestEmail && (
                  <p className="text-xs text-gray-500 truncate">{activeSession.guestEmail}</p>
                )}
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                {/* Toggle Client Image Permission */}
                <button
                  type="button"
                  onClick={handleToggleCustomerImages}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition border ${
                    activeSession?.allowCustomerImages
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
                      : 'bg-gray-50 text-gray-700 border-gray-300 hover:bg-gray-100'
                  }`}
                  title={
                    activeSession?.allowCustomerImages
                      ? "Le client peut actuellement envoyer des images. Cliquez pour désactiver."
                      : "Le client ne peut pas envoyer d'images. Cliquez pour l'autoriser."
                  }
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="hidden sm:inline">
                    {activeSession?.allowCustomerImages ? '✓ Images client autorisées' : '+ Autoriser images client'}
                  </span>
                  <span className="sm:hidden">
                    {activeSession?.allowCustomerImages ? '✓ Images OK' : '+ Images'}
                  </span>
                </button>

                <button
                  onClick={handleClose}
                  className="text-xs sm:text-sm text-red-600 hover:text-red-700 font-medium px-2.5 py-1.5 rounded-lg hover:bg-red-50 transition"
                >
                  {t('close_session')}
                </button>
              </div>
            </div>
            
            {/* Messages Feed */}
            <div className="flex-1 min-h-0 overflow-y-auto p-4 bg-gray-50/70 flex flex-col gap-3">
              {messages.map((msg) => {
                const isAdmin = msg.sender === ChatSender.ADMIN;
                return (
                  <div key={msg.id} className={`flex flex-col ${isAdmin ? 'items-end' : 'items-start'}`}>
                    <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm shadow-sm ${
                      isAdmin ? 'bg-orange-600 text-white rounded-br-none' : 'bg-white border border-gray-200 text-gray-900 rounded-bl-none'
                    }`}>
                      {msg.imageUrl && (
                        <div className="mb-2">
                          <a href={msg.imageUrl} target="_blank" rel="noopener noreferrer">
                            <img
                              src={msg.imageUrl}
                              alt="Attachment"
                              className="rounded-lg max-h-56 max-w-full object-cover border border-black/10 hover:opacity-95 transition"
                            />
                          </a>
                        </div>
                      )}
                      {msg.content && (
                        <div className="whitespace-pre-wrap break-words">{msg.content}</div>
                      )}
                    </div>
                    <span className="text-[10px] text-gray-500 mt-1 px-1">
                      {new Date(msg.createdAt).toLocaleString(locale, {
                        hour: '2-digit',
                        minute: '2-digit',
                        day: '2-digit',
                        month: '2-digit',
                      })}
                    </span>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area - ALWAYS visible at bottom */}
            <div className="p-3 sm:p-4 bg-white border-t border-gray-200 flex-shrink-0">
              {imagePreview && (
                <div className="mb-2 relative inline-block">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="h-16 w-16 object-cover rounded-lg border border-gray-300 shadow-sm"
                  />
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="absolute -top-1.5 -right-1.5 bg-red-600 text-white rounded-full p-0.5 shadow hover:bg-red-700 transition"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )}
              <form onSubmit={handleSend} className="flex gap-2 items-end">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  title="Joindre une image"
                  className="p-2.5 text-gray-500 hover:text-orange-600 hover:bg-orange-50 rounded-xl transition border border-gray-300 flex-shrink-0 h-[44px] w-[44px] flex items-center justify-center"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </button>
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={t('write_reply') + " (Maj+Entrée: nouvelle ligne)"}
                  rows={2}
                  className="flex-1 px-3.5 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 resize-none min-h-[44px] max-h-28 text-sm leading-relaxed"
                />
                <button
                  type="submit"
                  disabled={(!newMessage.trim() && !selectedFile) || isUploading}
                  className="bg-orange-600 hover:bg-orange-700 text-white px-5 py-2.5 rounded-xl font-medium transition disabled:opacity-50 flex-shrink-0 flex items-center justify-center min-w-[90px] h-[44px] shadow-sm text-sm"
                >
                  {isUploading ? (
                    <span className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></span>
                  ) : (
                    t('send')
                  )}
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500 flex-col p-6">
            <svg className="w-16 h-16 mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
            <p className="text-sm font-medium">{t('select_conversation')}</p>
          </div>
        )}
      </div>
    </div>
  );
}
