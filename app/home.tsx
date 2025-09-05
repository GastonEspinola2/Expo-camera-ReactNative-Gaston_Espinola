import { router } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Bienvenido</Text>
      <Text style={styles.subtitle}>Sesion iniciada correctamente.</Text>

      <Pressable style={[styles.button, { backgroundColor: '#10b981' }]} onPress={() => router.push('/admin/products')}>
        <Text style={styles.buttonText}>Panel de productos</Text>
      </Pressable>

      <Pressable style={styles.button} onPress={() => router.replace('/')}>
        <Text style={styles.buttonText}>Cerrar sesión</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: 'center', alignItems: 'center', gap: 16 },
  title: { fontSize: 28, fontWeight: '800' },
  subtitle: { fontSize: 16, color: '#555', textAlign: 'center' },
  button: {
    backgroundColor: '#3b82f6',
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 10,
  },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
