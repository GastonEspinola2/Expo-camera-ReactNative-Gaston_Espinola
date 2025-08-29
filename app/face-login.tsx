import AsyncStorage from '@react-native-async-storage/async-storage';
import { CameraView } from 'expo-camera';
import { useRouter } from 'expo-router';
import * as VideoThumbnails from 'expo-video-thumbnails';
import React, { useRef, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { recognizeFace } from '../utils/api';

const isValidCuil = (v: string) => /^\d{11}$/.test(v.replace(/\D/g, ''));

export default function FaceLoginScreen() {
  const cameraRef = useRef<CameraView | null>(null);
  const [loading, setLoading] = useState(false);
  const [cuilInput, setCuilInput] = useState('');
  const [readyToScan, setReadyToScan] = useState(false);
  const router = useRouter();

  const captureSilentImage = async (): Promise<string> => {
    const recPromise = cameraRef.current?.recordAsync({ maxDuration: 1 });
    setTimeout(() => { try { cameraRef.current?.stopRecording(); } catch {} }, 600);
    const video = await recPromise;
    if (!video?.uri) throw new Error('No se pudo grabar el video corto.');
    const { uri: frameUri } = await VideoThumbnails.getThumbnailAsync(video.uri, { time: 0 });
    return frameUri;
  };

  const handleEnableScan = async () => {
    const clean = cuilInput.replace(/\D/g, '');
    if (!isValidCuil(clean)) {
      Alert.alert('CUIL inválido', 'Ingresá 11 dígitos (solo números).');
      setReadyToScan(false);
      return;
    }
    // No hay verificación remota (tu backend no la expone). Habilitamos el escaneo.
    setReadyToScan(true);
    await AsyncStorage.setItem('faceCuil', clean); // opcional: lo guardamos local para conveniencia
  };

  const handleLogin = async () => {
    const clean = cuilInput.replace(/\D/g, '');
    if (!isValidCuil(clean)) {
      Alert.alert('CUIL inválido', 'Ingresá 11 dígitos (solo números).');
      return;
    }
    if (!readyToScan) {
      Alert.alert('Verificación pendiente', 'Primero ingresá tu CUIL y tocá "Habilitar escaneo".');
      return;
    }

    try {
      setLoading(true);

      // Captura silenciosa con fallback a foto
      let photoUri: string;
      try {
        photoUri = await captureSilentImage();
      } catch {
        const pic = await cameraRef.current?.takePictureAsync({ skipProcessing: true });
        if (!pic?.uri) throw new Error('No se pudo capturar la imagen.');
        photoUri = pic.uri;
      }

      const result = await recognizeFace({ uri: photoUri });
      console.log('RECOGNIZE RAW =>', result.raw); // DEBUG

      if (result.kind === 'no_face') {
        Alert.alert('Imagen inválida', 'No se detectó un rostro en la foto. Intentá de nuevo.');
        return;
      }
      if (result.kind === 'not_found') {
        Alert.alert('No reconocido', 'Se detectó un rostro, pero no coincide con ningún registro.');
        return;
      }
      if (result.kind === 'error') {
        Alert.alert('Error', result.message || 'No se pudo completar el reconocimiento.');
        return;
      }

      const recognizedCuil = (result.cuil || '').toString().replace(/\D/g, '');
      if (!recognizedCuil) {
        Alert.alert('Identidad desconocida', 'El servidor no devolvió identidad del rostro. Acceso denegado.');
        return;
      }

      if (recognizedCuil !== clean) {
        Alert.alert('No coincide', `El rostro corresponde al CUIL ${recognizedCuil}, pero ingresaste ${clean}.`);
        return;
      }

      // OK
      router.replace('/home');
    } catch (err) {
      const msg = (err as Error).message || 'Error en reconocimiento facial.';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      {/* Paso 1: CUIL */}
      <View style={styles.topPanel}>
        <Text style={styles.label}>CUIL</Text>
        <TextInput
          placeholder="20XXXXXXXXX"
          placeholderTextColor="#aaa"
          value={cuilInput}
          onChangeText={(t) => {
            setCuilInput(t);
            setReadyToScan(false); // si cambian el CUIL, hay que re-habilitar
          }}
          keyboardType="number-pad"
          style={styles.input}
          maxLength={14}
        />
        <Pressable
          style={[styles.buttonCheck, loading && { opacity: 0.7 }]}
          onPress={handleEnableScan}
          disabled={loading}
        >
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.text}>Habilitar escaneo</Text>}
        </Pressable>
        <Text style={[styles.small, { color: readyToScan ? '#22c55e' : '#aaa' }]}>
          {readyToScan ? 'CUIL listo. Podés escanear.' : 'Ingresá tu CUIL y habilitá el escaneo.'}
        </Text>
      </View>

      {/* Paso 2: Cámara */}
      <CameraView ref={cameraRef} style={{ flex: 1 }} facing="front" ratio="16:9" />

      {/* Paso 3: Escanear y entrar */}
      <View style={styles.bottom}>
        <Pressable
          style={[
            styles.buttonScan,
            (loading || !readyToScan) && { opacity: 0.6 },
          ]}
          onPress={handleLogin}
          disabled={loading || !readyToScan}
        >
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.text}>Escanear y entrar</Text>}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  topPanel: { padding: 16, backgroundColor: '#000', gap: 10 },
  label: { color: '#fff' },
  input: { backgroundColor: '#111', color: '#fff', borderRadius: 8, padding: 12, borderWidth: 1, borderColor: '#333' },
  buttonCheck: { backgroundColor: '#64748b', padding: 12, borderRadius: 8, alignItems: 'center' },
  bottom: { padding: 16, backgroundColor: '#000' },
  buttonScan: { backgroundColor: '#3b82f6', padding: 14, borderRadius: 8, alignItems: 'center' },
  text: { color: '#fff', fontWeight: '600' },
  small: { fontSize: 12 },
});
