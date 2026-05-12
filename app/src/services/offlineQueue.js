import AsyncStorage from '@react-native-async-storage/async-storage';

const QUEUE_KEY = '@offline_submissions';

export const offlineQueue = {
  async enqueue(payload) {
    const existing = await this.getQueue();
    const updated = [...existing, { ...payload, id: Date.now() }];
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(updated));
    return updated;
  },

  async getQueue() {
    const data = await AsyncStorage.getItem(QUEUE_KEY);
    return data ? JSON.parse(data) : [];
  },

  async clear() {
    await AsyncStorage.removeItem(QUEUE_KEY);
  },

  async remove(id) {
    const existing = await this.getQueue();
    const updated = existing.filter(item => item.id !== id);
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(updated));
  }
};
