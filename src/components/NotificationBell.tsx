'use client'

import { useState, useEffect, useRef } from 'react';
import { Bell, Check, Trash2 } from 'lucide-react';
import { getNotifications, markAsRead, markAllAsRead } from '@/app/actions/notifications';
import Link from 'next/link';
import { formatDateTime } from '@/lib/formatDate';
import { useRouter } from 'next/navigation';

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const loadNotifications = async () => {
    try {
      const data = await getNotifications();
      setNotifications(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        loadNotifications();
      }
    }, 45000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleNotificationClick = async (n: any) => {
    if (!n.isRead) {
      await markAsRead(n.id);
      loadNotifications();
    }
    setIsOpen(false);
    if (n.link) {
      router.push(n.link);
    }
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
    loadNotifications();
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="text-slate-600 hover:text-blue-600 hover:bg-white/80 transition relative p-2.5 rounded-xl border border-transparent hover:border-slate-200/60 hover:shadow-xs"
        aria-label="Notifications"
      >
        <Bell size={19} />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full border-2 border-white flex items-center justify-center animate-pulse shadow-xs">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-84 sm:w-96 glass-modal rounded-2xl shadow-2xl border border-white/80 overflow-hidden z-50">
          <div className="flex justify-between items-center px-4 py-3.5 bg-white/70 backdrop-blur-md border-b border-slate-200/70">
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-slate-900 text-sm">Notifications</h3>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-600 border border-blue-500/20">
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button 
                onClick={handleMarkAllAsRead} 
                className="text-xs text-blue-600 hover:text-blue-700 font-bold transition hover:underline"
              >
                Mark all read
              </button>
            )}
          </div>
          
          <div className="max-h-[360px] overflow-y-auto divide-y divide-slate-100/60">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-sm font-medium">
                No new notifications
              </div>
            ) : (
              notifications.map((n) => (
                <div 
                  key={n.id} 
                  onClick={() => handleNotificationClick(n)}
                  className={`p-4 hover:bg-blue-50/50 cursor-pointer transition flex items-start gap-3 ${!n.isRead ? 'bg-blue-50/30' : ''}`}
                >
                  <div className={`w-2 h-2 mt-2 rounded-full flex-shrink-0 ${!n.isRead ? 'bg-blue-600 ring-4 ring-blue-500/20' : 'bg-slate-300'}`} />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm leading-snug ${!n.isRead ? 'text-slate-900 font-semibold' : 'text-slate-600'}`}>
                      {n.message}
                    </p>
                    <p className="text-xs text-slate-400 mt-1 font-medium">
                      {formatDateTime(n.createdAt)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

