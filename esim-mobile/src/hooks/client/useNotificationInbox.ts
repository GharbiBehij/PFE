import { useCallback, useEffect, useState } from 'react';
import { addNotification, getNotifications, markAllRead, type LocalNotificationItem } from '../../storage/notificationsStorage';

export const useNotificationInbox = () => {
  const [items, setItems] = useState<LocalNotificationItem[]>([]);

  const reload = useCallback(async () => {
    const data = await getNotifications();
    setItems(data);
  }, []);

  const markRead = useCallback(async () => {
    await markAllRead();
    await reload();
  }, [reload]);

  const push = useCallback(async (title: string, body: string) => {
    await addNotification({ title, body });
    await reload();
  }, [reload]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return {
    items,
    unreadCount: items.filter((i) => !i.read).length,
    reload,
    markRead,
    push,
  };
};
