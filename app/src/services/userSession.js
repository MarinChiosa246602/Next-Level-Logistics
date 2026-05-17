import AsyncStorage from '@react-native-async-storage/async-storage';

export const userSession = {
  async setFarmer(farmer) {
    await AsyncStorage.setItem('@current_farmer', JSON.stringify(farmer));
  },

  async getFarmer() {
    const data = await AsyncStorage.getItem('@current_farmer');
    return data ? JSON.parse(data) : null;
  },

  async clear() {
    await AsyncStorage.removeItem('@current_farmer');
  }
};
