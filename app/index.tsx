import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import CrearModal from '../components/CrearModal';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [showCamera, setShowCamera] = useState(false);

  const handleFakeLogin = () => {
    if (email.trim().length > 0) router.replace('/home');
  };

  const handleFaceLoginSuccess = () => {
    setShowCamera(false);
    router.replace('/home');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login</Text>

      <Text style={styles.label}>Email (opcional):</Text>
      <TextInput
        placeholder="tu@email.com"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        style={styles.input}
      />

      <Pressable style={styles.buttonPrimary} onPress={handleFakeLogin}>
        <Text style={styles.buttonText}>Iniciar sesión (simulado)</Text>
      </Pressable>

      <Text style={styles.or}>o</Text>

      <Pressable style={styles.buttonCamera} onPress={() => setShowCamera(true)}>
        <Text style={styles.buttonText}>Reconocimiento facial</Text>
      </Pressable>

      <Modal visible={showCamera} animationType="slide">
        <CrearModal onCancel={() => setShowCamera(false)} onRecognized={handleFaceLoginSuccess} />
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: 'center', gap: 16, backgroundColor: '#fff' },
  title: { fontSize: 28, fontWeight: '700', textAlign: 'center', marginBottom: 8 },
  label: { fontSize: 14, color: '#333' },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  buttonPrimary: {
    backgroundColor: '#3b82f6',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonCamera: {
    backgroundColor: '#10b981',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonText: { color: 'white', fontWeight: '600', fontSize: 16 },
  or: { textAlign: 'center', color: '#666' },
});
