import AsyncStorage from '@react-native-async-storage/async-storage';
import { CameraView } from 'expo-camera';
import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { registerFace } from '../utils/api';

const isValidCuil = (v: string) => /^\d{11}$/.test(v.replace(/\D/g, ''));

export default function RegisterScreen() {
  const [cuil, setCuil] = useState('');
  const [loading, setLoading] = useState(false);
  const cameraRef = useRef<CameraView | null>(null);
  const router = useRouter();

  const handleRegister = async () => {
    const clean = cuil.replace(/\D/g, '');
    if (!isValidCuil(clean)) {
      Alert.alert('CUIL inválido', 'Ingresá 11 dígitos (solo números).');
      return;
    }

    try {
      setLoading(true);

      const pic = await cameraRef.current?.takePictureAsync({ skipProcessing: true });
      if (!pic?.uri) throw new Error('No se pudo capturar la imagen.');

      const { raw } = await registerFace({ cuil: clean, uri: pic.uri });

      await AsyncStorage.multiSet([
        ['faceRegistered', 'true'],
        ['faceCuil', clean],
      ]);

      console.log('REGISTER RAW =>', raw);

      Alert.alert('Éxito', 'Rostro registrado correctamente', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err) {
      const msg = (err as Error).message || 'Error al registrar rostro.';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <CameraView ref={cameraRef} style={{ flex: 1 }} facing="front" ratio="16:9" />
      <View style={styles.bottom}>
        <Text style={styles.label}>CUIL</Text>
        <TextInput
          placeholder="20XXXXXXXXX"
          placeholderTextColor="#aaa"
          value={cuil}
          onChangeText={setCuil}
          keyboardType="number-pad"
          style={styles.input}
          maxLength={14}
        />
        <Pressable style={[styles.button, loading && { opacity: 0.7 }]} onPress={handleRegister} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.text}>Registrar rostro</Text>}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bottom: { padding: 16, backgroundColor: '#000', gap: 10 },
  label: { color: '#fff' },
  input: { backgroundColor: '#111', color: '#fff', borderRadius: 8, padding: 12, borderWidth: 1, borderColor: '#333' },
  button: { backgroundColor: '#10b981', padding: 14, borderRadius: 8, alignItems: 'center' },
  text: { color: '#fff', fontWeight: '600' },
});
