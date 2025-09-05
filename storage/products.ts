import AsyncStorage from '@react-native-async-storage/async-storage';

export type Product = {
  id: string;
  code: string;
  name: string;
  price?: number;
};

const KEY = 'products_v1';

export async function loadProducts(): Promise<Product[]> {
  try {
    const s = await AsyncStorage.getItem(KEY);
    return s ? JSON.parse(s) : [];
  } catch {
    return [];
  }
}

export async function saveProducts(list: Product[]): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(list));
}

export function findByScanned(list: Product[], scannedType: string, scannedData: string): Product | undefined {
  const byExact = `${scannedType}-${scannedData}`;
  return (
    list.find(p => p.code === byExact) ||
    list.find(p => p.code === scannedData) ||
    list.find(p => p.code.toLowerCase() === byExact.toLowerCase()) ||
    list.find(p => p.code.toLowerCase() === scannedData.toLowerCase())
  );
}
