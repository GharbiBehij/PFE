import AsyncStorage from '@react-native-async-storage/async-storage';

export type LocalNotificationItem = {
  id: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
};

const KEY = 'netyfly_notifications';

export async function getNotifications(): Promise<LocalNotificationItem[]> {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as LocalNotificationItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function addNotification(item: Omit<LocalNotificationItem, 'id' | 'read' | 'createdAt'>) {
  const current = await getNotifications();
  const next: LocalNotificationItem = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    title: item.title,
    body: item.body,
    read: false,
    createdAt: new Date().toISOString(),
  };
  await AsyncStorage.setItem(KEY, JSON.stringify([next, ...current].slice(0, 100)));
}

export async function markAllRead() {
  const current = await getNotifications();
  const next = current.map((n) => ({ ...n, read: true }));
  await AsyncStorage.setItem(KEY, JSON.stringify(next));
}
