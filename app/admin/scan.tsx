import { CameraView, useCameraPermissions } from 'expo-camera';
import React, { useEffect, useState } from 'react';
import { Alert, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { findByScanned, loadProducts, Product } from '../../storage/products';

export default function ScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scannerOpen, setScannerOpen] = useState(true);
  const [scanLock, setScanLock] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [found, setFound] = useState<Product | null>(null);

  useEffect(() => {
    (async () => {
      const list = await loadProducts();
      setProducts(list);
      if (!permission || !permission.granted) {
        await requestPermission();
      }
    })();
  }, []);

  const handleBarcode = (event: any) => {
    if (scanLock) return;
    let payload: { data?: string; type?: string } | null = null;

    if (event?.data && event?.type) payload = { data: String(event.data), type: String(event.type) };
    else if (Array.isArray(event?.barcodes) && event.barcodes[0]?.data) {
      payload = { data: String(event.barcodes[0].data), type: String(event.barcodes[0].type) };
    }

    if (!payload?.data || !payload?.type) return;

    setScanLock(true);
    const hit = findByScanned(products, payload.type, payload.data);
    setScannerOpen(false);

    if (hit) {
      setFound(hit);
      Alert.alert('Producto encontrado', `${hit.name}\nCódigo: ${hit.code}\nPrecio: ${hit.price ?? '-'}`);
    } else {
      setFound(null);
      Alert.alert('No existe', 'No se encontró ningún producto con ese código.');
    }

    setTimeout(() => setScanLock(false), 700);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Escanear producto</Text>
      <Text style={styles.sub}>Apuntá al código de barras o QR.</Text>

      <Pressable style={[styles.btn, { backgroundColor: '#10b981' }]} onPress={() => setScannerOpen(true)}>
        <Text style={styles.btnText}>Abrir escáner</Text>
      </Pressable>

      {found && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{found.name}</Text>
          <Text style={styles.cardSub}>Código: {found.code}</Text>
          <Text style={styles.cardSub}>Precio: {found.price != null ? `$ ${found.price}` : '-'}</Text>
        </View>
      )}

      <Modal visible={scannerOpen} animationType="slide" onRequestClose={() => setScannerOpen(false)}>
        <View style={{ flex: 1, backgroundColor: '#000' }}>
          <CameraView
            style={{ flex: 1 }}
            facing="back"
            barcodeScannerSettings={{
              barcodeTypes: ['qr', 'ean13', 'ean8', 'code128', 'code39', 'upc_a', 'upc_e', 'itf14', 'pdf417'],
            }}
            onBarcodeScanned={handleBarcode}
          >
            <View style={styles.overlay}>
              <View style={styles.frame} />
            </View>
          </CameraView>

          <View style={styles.footer}>
            <Pressable style={[styles.btn, { backgroundColor: '#ef4444' }]} onPress={() => setScannerOpen(false)}>
              <Text style={styles.btnText}>Cerrar</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const FRAME = 260;

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 12, backgroundColor: '#fff' },
  title: { fontSize: 20, fontWeight: '800' },
  sub: { color: '#555' },
  btn: {
    paddingVertical: 12, paddingHorizontal: 16, borderRadius: 10, alignItems: 'center',
  },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  overlay: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  frame: { width: FRAME, height: FRAME, borderRadius: 16, borderWidth: 3, borderColor: 'rgba(255,255,255,0.9)' },
  footer: { padding: 16, backgroundColor: '#000' },
  card: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, padding: 12, marginTop: 10, backgroundColor: '#fff' },
  cardTitle: { fontSize: 16, fontWeight: '700' },
  cardSub: { fontSize: 13, color: '#555', marginTop: 2 },
});
