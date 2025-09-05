import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Login' }} />
      <Stack.Screen name="home" options={{ title: 'Bienvenido' }} />
      <Stack.Screen name="register" options={{ title: 'Registro facial' }} />
      <Stack.Screen name="face-login" options={{ title: 'Ingreso por rostro' }} />
      <Stack.Screen name="admin/products" options={{ title: 'Gestión de productos' }} />
      <Stack.Screen name="admin/scan" options={{ title: 'Escanear producto' }} />
      <Stack.Screen name="products/index" options={{ title: 'Productos' }} />
    </Stack>
  );
}
