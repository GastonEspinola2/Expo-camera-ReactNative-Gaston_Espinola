import { CameraView, useCameraPermissions } from 'expo-camera';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';

type Props = {
  onCancel: () => void;
  onRecognized: () => void;
};

export default function CrearModal({ onCancel, onRecognized }: Props) {
  const cameraRef = useRef<CameraView | null>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [isTaking, setIsTaking] = useState(false);

  useEffect(() => {
    (async () => {
      if (!permission || !permission.granted) {
        await requestPermission();
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!permission) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
        <Text style={styles.info}>Solicitando permisos de cámara…</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.info}>
          La app necesita acceso a la cámara para simular el reconocimiento facial.
        </Text>
        <Pressable style={styles.buttonPrimary} onPress={requestPermission}>
          <Text style={styles.buttonText}>Conceder permisos</Text>
        </Pressable>
        <Pressable style={styles.buttonGhost} onPress={onCancel}>
          <Text style={styles.buttonGhostText}>Cancelar</Text>
        </Pressable>
      </View>
    );
  }

  const handleCapture = async () => {
  try {
    setIsTaking(true);
    await new Promise((r) => setTimeout(r, 800));

    Alert.alert('Reconocimiento facial', '¡Rostro reconocido exitosamente!', [
      { text: 'Continuar', onPress: onRecognized },
    ]);
  } catch (e) {
    Alert.alert('Error', 'Ocurrió un problema.');
  } finally {
    setIsTaking(false);
  }
};

  return (
    <View style={styles.container}>
      <CameraView
        ref={(r) => (cameraRef.current = r)}
        style={styles.camera}
        facing="front"   // ✅ en SDK 50/51 se usa "facing"
        ratio="16:9"
      >
        <View style={styles.overlay}>
          <View style={styles.faceGuide} />
        </View>
      </CameraView>

      <View style={styles.controls}>
        <Pressable style={styles.buttonGhost} onPress={onCancel} disabled={isTaking}>
          <Text style={styles.buttonGhostText}>Cancelar</Text>
        </Pressable>

        <Pressable
          style={[styles.buttonPrimary, isTaking && { opacity: 0.6 }]}
          onPress={handleCapture}
          disabled={isTaking}
        >
          {isTaking ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Escanear rostro</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const GUIDE_SIZE = 220;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  camera: { flex: 1 },
  overlay: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  faceGuide: {
    width: GUIDE_SIZE,
    height: GUIDE_SIZE,
    borderRadius: GUIDE_SIZE / 2,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.9)',
    backgroundColor: 'transparent',
  },
  controls: {
    padding: 16,
    backgroundColor: '#000',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  buttonPrimary: {
    flex: 1,
    backgroundColor: '#10b981',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonText: { color: 'white', fontWeight: '700', fontSize: 16 },
  buttonGhost: {
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#444',
  },
  buttonGhostText: { color: '#ddd', fontWeight: '600', fontSize: 16 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 },
  info: { color: '#333', textAlign: 'center' },
});
