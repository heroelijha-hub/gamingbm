'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import {
  getAdminSessions,
  sendAdminMessage,
  closeSession,
  deleteSession,
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
  const [activeSessionId, setActiveSessionId] = useState<string | null>(
    initialSessions[0]?.id || null
  );
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'ALL' | 'OPEN' | 'CLOSED'>('ALL');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeSession = sessions.find(s => s.id === activeSessionId);

  // Poll for sessions list (left sidebar)
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const freshSessions = await getAdminSessions();
        setSessions(freshSessions);
      } catch (err) {
        console.error('Failed to poll sessions', err);
      }
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Fetch and poll messages for active session
  useEffect(() => {
    if (!activeSessionId) return;

    const fetchMessages = async () => {
      try {
        const msgs = await getAdminSessionMessages(activeSessionId);
        setMessages(msgs);
      } catch (err) {
        console.error('Failed to fetch messages', err);
      }
    };

    fetchMessages();
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [activeSessionId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Counts
  const totalCount = sessions.length;
  const openCount = useMemo(() => sessions.filter(s => s.status === 'OPEN').length, [sessions]);
  const closedCount = useMemo(() => sessions.filter(s => s.status === 'CLOSED').length, [sessions]);

  // Filtered sessions
  const filteredSessions = useMemo(() => {
    return sessions.filter(s => {
      // Tab filter
      if (activeTab === 'OPEN' && s.status !== 'OPEN') return false;
      if (activeTab === 'CLOSED' && s.status !== 'CLOSED') return false;

      // Search filter
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const nameMatch = (s.guestName || '').toLowerCase().includes(query);
        const emailMatch = (s.guestEmail || '').toLowerCase().includes(query);
        const msgMatch = (s.messages?.[0]?.content || '').toLowerCase().includes(query);
        return nameMatch || emailMatch || msgMatch;
      }
      return true;
    });
  }, [sessions, activeTab, searchTerm]);

  // Format date like screenshot: "10:44" if today, "25.11." if past
  const formatTimestamp = (dateInput: Date | string) => {
    if (!dateInput) return '';
    const date = new Date(dateInput);
    const now = new Date();
    const isToday =
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear();

    if (isToday) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${day}.${month}.`;
  };

  const getInitials = (name?: string | null, email?: string | null) => {
    if (name && name.trim()) {
      return name.trim().charAt(0).toUpperCase();
    }
    if (email && email.trim()) {
      return email.trim().charAt(0).toUpperCase();
    }
    return 'G';
  };

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
    if (confirm(t('confirm_close') || 'Möchten Sie diese Konversation wirklich schließen?')) {
      await closeSession(activeSessionId);
      const fresh = await getAdminSessions();
      setSessions(fresh);
    }
  };

  const handleDelete = async () => {
    if (!activeSessionId) return;
    if (confirm('Möchten Sie dieses Gespräch endgültig löschen?')) {
      await deleteSession(activeSessionId);
      const fresh = await getAdminSessions();
      setSessions(fresh);
      setActiveSessionId(fresh[0]?.id || null);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200/90 shadow-sm overflow-hidden flex h-full min-h-0 font-sans">
      {/* ──────────────── Left Sidebar: Conversations List ──────────────── */}
      <div className="w-[320px] lg:w-[350px] border-r border-gray-200/80 flex flex-col bg-white h-full min-h-0 flex-shrink-0">
        {/* Header: Title + Counter */}
        <div className="p-4 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-gray-900 text-base">Aktive Gespräche</h2>
            <span className="w-5 h-5 rounded-full bg-gray-100 text-gray-600 text-xs font-semibold flex items-center justify-center">
              {totalCount}
            </span>
          </div>

          {/* Search bar */}
          <div className="relative mb-3">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Suchen..."
              className="w-full bg-white border border-gray-200 rounded-lg pl-8 pr-3 py-1.5 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition"
            />
            <svg
              className="w-4 h-4 text-gray-400 absolute left-2.5 top-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setActiveTab('ALL')}
              className={`px-3 py-1 rounded-md text-xs font-medium transition ${
                activeTab === 'ALL'
                  ? 'bg-gray-100 text-gray-900 font-semibold'
                  : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              Alle ({totalCount})
            </button>
            <button
              onClick={() => setActiveTab('OPEN')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition ${
                activeTab === 'OPEN'
                  ? 'bg-gray-100 text-gray-900 font-semibold'
                  : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              Offen ({openCount})
            </button>
            <button
              onClick={() => setActiveTab('CLOSED')}
              className={`px-3 py-1 rounded-md text-xs font-medium transition ${
                activeTab === 'CLOSED'
                  ? 'bg-gray-100 text-gray-900 font-semibold'
                  : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              Geschlossen ({closedCount})
            </button>
          </div>
        </div>

        {/* Conversations Scrollable List */}
        <div className="flex-1 min-h-0 overflow-y-auto divide-y divide-gray-50">
          {filteredSessions.map((s, idx) => {
            const isSelected = activeSessionId === s.id;
            const initials = getInitials(s.guestName, s.guestEmail);
            const lastMsg = s.messages?.[0];
            const dateStr = formatTimestamp(lastMsg?.createdAt || s.updatedAt);

            return (
              <button
                key={s.id}
                onClick={() => setActiveSessionId(s.id)}
                className={`w-full text-left p-3.5 transition flex items-start gap-3 relative ${
                  isSelected
                    ? 'bg-[#FDF0EB] border-l-4 border-[#A33B10]'
                    : 'hover:bg-gray-50/80 bg-white'
                }`}
              >
                {/* Avatar */}
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${
                    isSelected
                      ? 'bg-[#A33B10] text-white shadow-xs'
                      : idx % 2 === 0
                      ? 'bg-gray-200 text-gray-700'
                      : 'bg-orange-100 text-[#A33B10]'
                  }`}
                >
                  {initials}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 pr-1">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="font-semibold text-sm text-gray-900 truncate">
                      {s.guestName ? s.guestName : `Gast ${s.guestId.substring(0, 6)}`}
                    </span>
                    <span className="text-[11px] text-gray-400 font-normal flex-shrink-0 ml-1">
                      {dateStr}
                    </span>
                  </div>

                  {s.guestEmail && (
                    <p className="text-xs text-[#B85D36] truncate mb-1">
                      {s.guestEmail}
                    </p>
                  )}

                  <div className="flex items-center justify-between gap-2 mt-1">
                    <p className="text-xs text-gray-400 truncate flex-1">
                      {lastMsg?.content ? (
                        lastMsg.content
                      ) : lastMsg?.imageUrl ? (
                        '📷 Foto'
                      ) : (
                        'Keine Nachrichten'
                      )}
                    </p>

                    <div className="flex items-center gap-1 flex-shrink-0">
                      {s.allowCustomerImages && (
                        <span
                          className="text-[9px] bg-blue-100 text-blue-700 px-1 py-0.2 rounded font-medium"
                          title="Kunde darf Fotos senden"
                        >
                          📷
                        </span>
                      )}
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded tracking-wide ${
                          s.status === 'OPEN'
                            ? 'bg-[#D1F2D9] text-[#1E7E34]'
                            : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {s.status}
                      </span>
                    </div>
                  </div>
                </div>
              </button>
            );
          })}

          {filteredSessions.length === 0 && (
            <div className="p-8 text-center text-xs text-gray-400">
              Keine Gespräche gefunden.
            </div>
          )}
        </div>
      </div>

      {/* ──────────────── Right Main Chat Panel ──────────────── */}
      <div className="flex-1 flex flex-col bg-white h-full min-h-0 min-w-0">
        {activeSession ? (
          <>
            {/* Header: User Info & Actions */}
            <div className="p-4 border-b border-gray-200/80 flex items-center justify-between bg-white flex-shrink-0 shadow-2xs">
              {/* Left: Avatar + Name + Status + Email */}
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-full bg-[#FDF0EB] text-[#A33B10] font-bold flex items-center justify-center flex-shrink-0 border border-orange-200/60">
                  {getInitials(activeSession.guestName, activeSession.guestEmail)}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-gray-900 text-base truncate">
                      {activeSession.guestName || 'Gast'}
                    </h3>
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded tracking-wide ${
                        activeSession.status === 'OPEN'
                          ? 'bg-[#D1F2D9] text-[#1E7E34]'
                          : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {activeSession.status}
                    </span>
                  </div>
                  {activeSession.guestEmail && (
                    <div className="flex items-center gap-1 text-xs text-[#B85D36] truncate mt-0.5">
                      <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <span className="truncate">{activeSession.guestEmail}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Right: Actions */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {/* Photo Permission Toggle */}
                <button
                  type="button"
                  onClick={handleToggleCustomerImages}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition border ${
                    activeSession.allowCustomerImages
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
                      : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                  }`}
                  title={
                    activeSession.allowCustomerImages
                      ? "Fotos für diesen Kunden erlauben. Klicken zum Deaktivieren."
                      : "Kunde darf aktuell keine Fotos senden. Klicken zum Erlauben."
                  }
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="hidden sm:inline">
                    {activeSession.allowCustomerImages ? '✓ Kundenfotos erlaubt' : '+ Kundenfotos erlauben'}
                  </span>
                  <span className="sm:hidden">
                    {activeSession.allowCustomerImages ? '✓ Fotos' : '+ Fotos'}
                  </span>
                </button>

                {/* Close Session Button */}
                <button
                  onClick={handleClose}
                  className="border border-gray-200 text-gray-700 hover:bg-gray-50 text-xs font-medium px-3 py-1.5 rounded-lg transition"
                >
                  Sitzung schließen
                </button>

                {/* Delete Conversation Button */}
                <button
                  onClick={handleDelete}
                  title="Gespräch löschen"
                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Messages Feed */}
            <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 bg-[#FAFAFA] flex flex-col gap-5">
              {messages.map((msg) => {
                const isAdmin = msg.sender === ChatSender.ADMIN;
                const authorName = isAdmin ? 'Support' : activeSession.guestName || 'Gast';
                const timeStr = new Date(msg.createdAt).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                });

                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isAdmin ? 'items-end' : 'items-start'}`}
                  >
                    {/* Label: Author · Time */}
                    <span className="text-[11px] text-gray-400 mb-1 px-1">
                      {authorName} · {timeStr}
                    </span>

                    {/* Bubble */}
                    <div
                      className={`max-w-[72%] rounded-2xl px-4 py-3 text-sm shadow-2xs leading-relaxed whitespace-pre-wrap break-words ${
                        isAdmin
                          ? 'bg-[#A33B10] text-white rounded-tr-xs'
                          : 'bg-white text-gray-900 border border-gray-200/80 rounded-tl-xs'
                      }`}
                    >
                      {/* Attached Image if any */}
                      {msg.imageUrl && (
                        <div className="mb-2">
                          <a
                            href={msg.imageUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block overflow-hidden rounded-xl"
                          >
                            <img
                              src={msg.imageUrl}
                              alt="Attachment"
                              className="rounded-xl max-h-60 max-w-full object-cover hover:scale-102 transition duration-200"
                            />
                          </a>
                        </div>
                      )}

                      {msg.content && <div>{msg.content}</div>}
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <div className="p-3 sm:p-4 bg-white border-t border-gray-200/80 flex-shrink-0">
              {/* Image Thumbnail Preview */}
              {imagePreview && (
                <div className="mb-2.5 relative inline-block">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="h-16 w-16 object-cover rounded-xl border border-gray-300 shadow-xs"
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

              <form onSubmit={handleSend} className="flex gap-2.5 items-end">
                {/* Hidden File Input */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="hidden"
                />

                {/* Attach Image Button */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  title="Foto anhängen"
                  className="p-2.5 text-gray-400 hover:text-[#A33B10] hover:bg-orange-50 rounded-xl transition border border-gray-200 flex-shrink-0 h-[42px] w-[42px] flex items-center justify-center"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </button>

                {/* Textarea */}
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Schreibe eine Antwort..."
                  rows={1}
                  className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#A33B10] focus:ring-1 focus:ring-[#A33B10] resize-none min-h-[42px] max-h-32 transition leading-relaxed"
                />

                {/* Send Button */}
                <button
                  type="submit"
                  disabled={(!newMessage.trim() && !selectedFile) || isUploading}
                  className="bg-[#C87A5B] hover:bg-[#A33B10] text-white font-medium rounded-xl px-6 py-2.5 text-sm transition disabled:opacity-50 flex-shrink-0 flex items-center justify-center min-w-[95px] h-[42px] shadow-xs"
                >
                  {isUploading ? (
                    <span className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></span>
                  ) : (
                    'Schicken'
                  )}
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400 flex-col p-8">
            <svg className="w-16 h-16 mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <p className="text-sm">Wählen Sie eine Konversation aus</p>
          </div>
        )}
      </div>
    </div>
  );
}
