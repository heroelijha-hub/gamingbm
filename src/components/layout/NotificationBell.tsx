'use client';

import { useState, useEffect, useRef } from 'react';
import { getUserNotifications, getAdminNotifications, markAsRead, markAllAsRead } from '@/actions/notification';
import { Notification } from '@prisma/client';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

interface NotificationBellProps {
  isAdmin?: boolean;
  userId?: string;
}

export default function NotificationBell({ isAdmin = false, userId }: NotificationBellProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [guestId, setGuestId] = useState<string | undefined>(undefined);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const t = useTranslations('Notifications');

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const decodeMessage = (raw: string): string => {
    try {
      const parsed = JSON.parse(raw);
      if (parsed.key === 'new_support_message') return t('new_support_message');
      if (parsed.key === 'new_chat_from') return t('new_chat_from', { name: parsed.name });
      if (parsed.key === 'new_order_from') return t('new_order_from', { name: parsed.name, amount: parsed.amount });
      return raw;
    } catch {
      return raw;
    }
  };

  useEffect(() => {
    if (!isAdmin && !userId) {
      const gId = localStorage.getItem('chat_guest_id');
      if (gId) setGuestId(gId);
    }
  }, [isAdmin, userId]);

  const fetchNotifications = async () => {
    try {
      let data: Notification[] = [];
      if (isAdmin) {
        data = await getAdminNotifications();
      } else if (userId || guestId) {
        data = await getUserNotifications(userId, guestId);
      }

      setNotifications(prev => {
        const prevUnreadIds = new Set(prev.filter(n => !n.isRead).map(n => n.id));
        const currentUnread = data.filter(n => !n.isRead);

        let hasNew = false;
        for (const n of currentUnread) {
          if (!prevUnreadIds.has(n.id)) { hasNew = true; break; }
        }

        if (hasNew) {
          const audio = new Audio('/notification.mp3');
          audio.play().catch(e => console.log('Audio play failed:', e));
        }

        return data;
      });
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000);
    return () => clearInterval(interval);
  }, [isAdmin, userId, guestId]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      // Automatically mark all unread notifications as read when the user opens the notification panel
      if (unreadCount > 0) {
        handleMarkAllAsRead();
      }
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, unreadCount]);

  const handleMarkAsRead = async (id: string) => {
    await markAsRead(id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead(isAdmin, userId, guestId);
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Notifications"
        className="relative p-2 text-gray-600 hover:text-orange-700 transition focus:outline-none flex items-center justify-center"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center w-4 h-4 text-[10px] font-bold leading-none text-white transform translate-x-1/4 -translate-y-1/4 bg-red-600 rounded-full shadow-sm">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="fixed inset-x-4 top-20 mx-auto max-w-xs sm:max-w-none sm:absolute sm:inset-auto sm:right-0 sm:top-auto sm:mt-2 w-auto sm:w-80 bg-white rounded-lg shadow-xl border border-gray-100 z-50 overflow-hidden">
          <div className="p-3 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
            <h3 className="font-semibold text-gray-800 text-sm">{t('title')}</h3>
            {unreadCount > 0 && (
              <button onClick={handleMarkAllAsRead} className="text-xs text-orange-700 hover:text-orange-700 font-medium">
                {t('mark_all_read')}
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-sm text-gray-500">{t('no_notifications')}</div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {notifications.map(n => (
                  <li 
                    key={n.id} 
                    onClick={() => { if (!n.isRead) handleMarkAsRead(n.id); }}
                    className={`p-4 transition cursor-pointer ${n.isRead ? 'bg-white hover:bg-gray-50' : 'bg-orange-50/60 hover:bg-orange-50'}`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {n.type === 'CHAT' && <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">{t('label_chat')}</span>}
                          {n.type === 'ORDER' && <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">{t('label_order')}</span>}
                          <span className="text-[10px] text-gray-500">
                            {new Date(n.createdAt).toLocaleDateString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className={`text-sm ${n.isRead ? 'text-gray-600' : 'text-gray-900 font-medium'}`}>
                          {decodeMessage(n.message)}
                        </p>
                        {n.link && (
                          <Link
                            href={n.link}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!n.isRead) handleMarkAsRead(n.id);
                              setIsOpen(false);
                            }}
                            className="text-xs text-orange-700 hover:underline mt-2 inline-block font-medium"
                          >
                            {t('view_details')} &rarr;
                          </Link>
                        )}
                      </div>
                      {!n.isRead && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMarkAsRead(n.id);
                          }}
                          className="w-2 h-2 rounded-full bg-orange-600 mt-1 ml-3 flex-shrink-0"
                          title={t('mark_all_read')}
                        />
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
