'use client';

import { useState, useEffect, useMemo } from 'react';
import { Bell, Check, Info, AlertTriangle } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { format, differenceInDays, isSameDay, startOfDay } from 'date-fns';
import { initialFindings } from '@/lib/mock-data';
import type { Notification, AuditFinding } from '@/types';
import Link from 'next/link';

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const generated: Notification[] = [];
    const today = startOfDay(new Date());

    initialFindings.forEach((finding: AuditFinding) => {
      const targetDate = finding.revalidationDate || finding.mitigationDueDate;
      if (!targetDate) return;

      const date = new Date(targetDate as Date);
      const diffDays = differenceInDays(date, today);

      if (isSameDay(date, today)) {
        generated.push({
          id: `due-${finding.id}`,
          title: 'Deadline Today',
          message: `The deadline for "${finding.title}" is today.`,
          date: new Date(),
          read: false,
          type: 'alert',
          findingId: finding.id,
        });
      } else if (diffDays === 1) {
        generated.push({
          id: `due-1d-${finding.id}`,
          title: 'Due Tomorrow',
          message: `"${finding.title}" is due in 1 day.`,
          date: new Date(),
          read: false,
          type: 'warning',
          findingId: finding.id,
        });
      } else if (diffDays === 7) {
        generated.push({
          id: `due-7d-${finding.id}`,
          title: 'Upcoming Deadline',
          message: `"${finding.title}" is due in 1 week.`,
          date: new Date(),
          read: false,
          type: 'info',
          findingId: finding.id,
        });
      }
    });

    setNotifications(generated);
  }, []);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-9 w-9">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -right-1 -top-1 h-5 w-5 justify-center rounded-full p-0 text-[10px]"
            >
              {unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-4 pb-2">
          <h4 className="text-sm font-semibold">Notifications</h4>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto p-0 text-xs text-primary hover:bg-transparent"
              onClick={markAllAsRead}
            >
              Mark all as read
            </Button>
          )}
        </div>
        <Separator />
        <ScrollArea className="h-[300px]">
          {notifications.length > 0 ? (
            <div className="grid">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`flex flex-col gap-1 p-4 transition-colors hover:bg-muted/50 ${
                    !notification.read ? 'bg-primary/5' : ''
                  }`}
                  onClick={() => markAsRead(notification.id)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {notification.type === 'alert' && (
                        <AlertTriangle className="h-4 w-4 text-destructive" />
                      )}
                      {notification.type === 'warning' && (
                        <AlertTriangle className="h-4 w-4 text-orange-500" />
                      )}
                      {notification.type === 'info' && (
                        <Info className="h-4 w-4 text-blue-500" />
                      )}
                      <span className="text-sm font-medium">
                        {notification.title}
                      </span>
                    </div>
                    {!notification.read && (
                      <div className="mt-1 h-2 w-2 rounded-full bg-primary" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {notification.message}
                  </p>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] text-muted-foreground">
                      {format(notification.date, 'MMM d, h:mm a')}
                    </span>
                    {notification.findingId && (
                      <Link
                        href={`/findings/respond/${notification.findingId}`}
                        className="text-[10px] font-medium text-primary hover:underline"
                        onClick={() => setIsOpen(false)}
                      >
                        View Finding
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex h-full items-center justify-center p-8 text-center text-sm text-muted-foreground">
              No new notifications
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
