import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Product, loadProducts, saveProducts } from '../../storage/products';

export default function ProductsAdminFormScreen() {
  const router = useRouter();

  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [price, setPrice] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const [products, setProducts] = useState<Product[]>([]);

  const [permission, requestPermission] = useCameraPermissions();
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scanLock, setScanLock] = useState(false);

  useEffect(() => {
    (async () => {
      const existing = await loadProducts();
      setProducts(existing);
      if (!permission || !permission.granted) {
        await requestPermission();
      }
    })();
  }, []);

  const validate = () => {
    if (!code.trim()) {
      Alert.alert('Datos incompletos', 'Ingresá o escaneá un código.');
      return false;
    }
    if (!name.trim()) {
      Alert.alert('Datos incompletos', 'Ingresá un nombre.');
      return false;
    }
    if (price.trim() && Number.isNaN(Number(price))) {
      Alert.alert('Precio inválido', 'Debe ser numérico.');
      return false;
    }
    return true;
  };

  const onSave = async () => {
    try {
      if (!validate()) return;
      setLoading(true);

      const priceNum = price.trim() ? Number(price) : undefined;
      const newP: Product = {
        id: `p-${Date.now()}`,
        code: code.trim(),
        name: name.trim(),
        price: priceNum,
      };

      const next = [newP, ...products];
      await saveProducts(next);

      setCode('');
      setName('');
      setPrice('');

      Alert.alert('Éxito', 'Producto agregado correctamente.', [
        { text: 'OK', onPress: () => router.replace('/products') },
      ]);
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'No se pudo guardar el producto.');
    } finally {
      setLoading(false);
    }
  };

  const openScanner = async () => {
    if (!permission || !permission.granted) {
      const { granted } = await requestPermission();
      if (!granted) {
        Alert.alert('Permiso requerido', 'Se necesita acceso a la cámara.');
        return;
      }
    }
    setScanLock(false);
    setScannerOpen(true);
  };

  const handleBarcode = (event: any) => {
    if (scanLock) return;

    let payload: { data?: string; type?: string } | null = null;
    if (event?.data && event?.type) {
      payload = { data: String(event.data), type: String(event.type) };
    } else if (Array.isArray(event?.barcodes) && event.barcodes[0]?.data) {
      payload = { data: String(event.barcodes[0].data), type: String(event.barcodes[0].type) };
    }
    if (!payload?.data || !payload?.type) return;

    setScanLock(true);
    const parsed = `${String(payload.type).toLowerCase()}-${payload.data}`;
    setCode(parsed);
    Alert.alert('Código leído', parsed);
    setScannerOpen(false);
    setTimeout(() => setScanLock(false), 700);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Agregar producto</Text>

      <View style={styles.formRow}>
        <Text style={styles.label}>Código</Text>
        <View style={styles.codeRow}>
          <TextInput
            placeholder="Escaneá o escribí el código"
            value={code}
            onChangeText={setCode}
            style={[styles.input, { flex: 1 }]}
            autoCapitalize="none"
          />
          <Pressable style={[styles.btn, { backgroundColor: '#3b82f6' }]} onPress={openScanner}>
            <Text style={styles.btnText}>Escanear</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.formRow}>
        <Text style={styles.label}>Nombre</Text>
        <TextInput
          placeholder="Nombre del producto"
          value={name}
          onChangeText={setName}
          style={styles.input}
        />
      </View>

      <View style={styles.formRow}>
        <Text style={styles.label}>Precio (opcional)</Text>
        <TextInput
          placeholder="0"
          value={price}
          onChangeText={setPrice}
          keyboardType="numeric"
          style={styles.input}
        />
      </View>

      <Pressable
        style={[styles.primaryBtn, loading && { opacity: 0.7 }]}
        onPress={onSave}
        disabled={loading}
      >
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryText}>Agregar</Text>}
      </Pressable>

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
            <View style={styles.overlay}><View style={styles.frame} /></View>
          </CameraView>
          <View style={styles.scannerFooter}>
            <Pressable
              style={[styles.primaryBtn, { backgroundColor: '#ef4444' }]}
              onPress={() => setScannerOpen(false)}
            >
              <Text style={styles.primaryText}>Cerrar escáner</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const FRAME = 260;

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  sectionTitle: { fontSize: 18, fontWeight: '800', marginBottom: 8 },

  formRow: { marginBottom: 10 },
  label: { fontSize: 13, color: '#333', marginBottom: 6 },
  input: {
    borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 10, fontSize: 16, backgroundColor: '#fff'
  },
  codeRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },

  primaryBtn: {
    backgroundColor: '#3b82f6', paddingVertical: 12, paddingHorizontal: 16,
    borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginTop: 6,
  },
  primaryText: { color: '#fff', fontWeight: '700', fontSize: 16 },

  btn: {
    backgroundColor: '#3f3f46', paddingVertical: 10, paddingHorizontal: 12,
    borderRadius: 10, alignItems: 'center', justifyContent: 'center'
  },
  btnText: { color: '#fff', fontWeight: '600' },

  overlay: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  frame: { width: FRAME, height: FRAME, borderRadius: 16, borderWidth: 3, borderColor: 'rgba(255,255,255,0.9)' },
  scannerFooter: { padding: 16, backgroundColor: '#000' },
});
