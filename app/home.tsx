import { router } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Bienvenido</Text>
      <Text style={styles.subtitle}>Sesión iniciada correctamente.</Text>

      <Pressable
        style={[styles.button, { backgroundColor: '#0ea5e9' }]}
        onPress={() => router.push('/products')}
      >
        <Text style={styles.buttonText}>Ver productos</Text>
      </Pressable>

      <Pressable
        style={[styles.button, { backgroundColor: '#10b981' }]}
        onPress={() => router.push('/admin/products')}
      >
        <Text style={styles.buttonText}>Panel de productos</Text>
      </Pressable>

      <Pressable
        style={[styles.button, { backgroundColor: '#3b82f6' }]}
        onPress={() => router.replace('/')}
      >
        <Text style={styles.buttonText}>Cerrar sesión</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: 'center', alignItems: 'center', gap: 16, backgroundColor: '#fff' },
  title: { fontSize: 28, fontWeight: '800' },
  subtitle: { fontSize: 16, color: '#555', textAlign: 'center' },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
