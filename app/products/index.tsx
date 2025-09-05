import { CameraView, useCameraPermissions } from 'expo-camera';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Product, findByScanned, loadProducts } from '../../storage/products';

export default function ProductsPublicScreen() {
  const [all, setAll] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const [manualCode, setManualCode] = useState('');
  const [searching, setSearching] = useState(false);
  const [found, setFound] = useState<Product | null>(null);

  const [permission, requestPermission] = useCameraPermissions();
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scanLock, setScanLock] = useState(false);

  useEffect(() => {
    (async () => {
      const list = await loadProducts();
      setAll(list);
      setLoading(false);
      if (!permission || !permission.granted) {
        await requestPermission();
      }
    })();
  }, []);

  const listToRender = useMemo(() => (found ? [found] : all), [all, found]);

  const findByManual = (input: string) => {
    const raw = input.trim();
    if (!raw) return undefined;
    const lowered = raw.toLowerCase();

    let hit =
      all.find(p => p.code === raw) ||
      all.find(p => p.code.toLowerCase() === lowered);

    if (hit) return hit;

    hit =
      all.find(p => p.code.endsWith(`-${raw}`)) ||
      all.find(p => p.code.toLowerCase().endsWith(`-${lowered}`));

    return hit;
  };

  const handleManualSearch = async () => {
    try {
      if (!manualCode.trim()) {
        Alert.alert('Faltan datos', 'Ingresá un código para buscar.');
        return;
      }
      setSearching(true);
      const hit = findByManual(manualCode);
      setFound(hit ?? null);

      if (hit) {
        Alert.alert('Producto encontrado', `${hit.name}\nCódigo: ${hit.code}\nPrecio: ${hit.price ?? '-'}`);
      } else {
        Alert.alert('No existe', 'No se encontró ningún producto con ese código.');
      }
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'No se pudo buscar el producto.');
    } finally {
      setSearching(false);
    }
  };

  const openScanner = async () => {
    if (!permission || !permission.granted) {
      const { granted } = await requestPermission();
      if (!granted) {
        Alert.alert('Permiso requerido', 'Se necesita acceso a la cámara para escanear códigos.');
        return;
      }
    }
    setScanLock(false);
    setScannerOpen(true);
  };

  const handleBarcodeScanned = (event: any) => {
    if (scanLock) return;

    let payload: { data?: string; type?: string } | null = null;
    if (event?.data && event?.type) {
      payload = { data: String(event.data), type: String(event.type) };
    } else if (Array.isArray(event?.barcodes) && event.barcodes[0]?.data) {
      payload = { data: String(event.barcodes[0].data), type: String(event.barcodes[0].type) };
    }
    if (!payload?.data || !payload?.type) return;

    setScanLock(true);
    const hit = findByScanned(all, String(payload.type).toLowerCase(), payload.data);
    setScannerOpen(false);

    if (hit) {
      setFound(hit);
      setManualCode(payload.data);
      Alert.alert('Producto encontrado', `${hit.name}\nCódigo: ${hit.code}\nPrecio: ${hit.price ?? '-'}`);
    } else {
      setFound(null);
      setManualCode(payload.data);
      Alert.alert('No existe', 'No se encontró ningún producto con ese código.');
    }

    setTimeout(() => setScanLock(false), 700);
  };

  const clearFilter = () => setFound(null);

  const renderItem = ({ item }: { item: Product }) => (
    <View style={[styles.card, found?.id === item.id && styles.cardHighlight]}>
      <Text style={styles.cardTitle}>{item.name}</Text>
      <Text style={styles.cardSub}>Código: {item.code}</Text>
      <Text style={styles.cardSub}>Precio: {item.price != null ? `$ ${item.price}` : '-'}</Text>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator />
        <Text style={{ marginTop: 8, color: '#555' }}>Cargando productos…</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.searchCard}>
        <Text style={styles.sectionTitle}>Buscar dentro de los productos</Text>
        <Text style={styles.label}>Código (escribí o escaneá)</Text>

        <View style={styles.row}>
          <TextInput
            placeholder="Ej: 7791234567890"
            value={manualCode}
            onChangeText={setManualCode}
            style={[styles.input, { flex: 1 }]}
            autoCapitalize="none"
          />
          <Pressable style={styles.buttonSmall} onPress={openScanner}>
            <Text style={styles.buttonSmallText}>Escanear</Text>
          </Pressable>
        </View>

        <View style={styles.actionsRow}>
          <Pressable
            style={[styles.primaryBtn, searching && { opacity: 0.7 }]}
            onPress={handleManualSearch}
            disabled={searching}
          >
            {searching ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryText}>Buscar</Text>}
          </Pressable>

          {found && (
            <Pressable style={[styles.btn, { backgroundColor: '#94a3b8' }]} onPress={clearFilter}>
              <Text style={styles.btnText}>Limpiar filtro</Text>
            </Pressable>
          )}
        </View>
      </View>

      <Text style={[styles.sectionTitle, { marginTop: 8 }]}>
        {found ? 'Resultado' : 'Todos los productos'}
      </Text>

      {listToRender.length === 0 ? (
        <Text style={{ color: '#666', marginTop: 8 }}>No hay productos cargados.</Text>
      ) : (
        <FlatList
          data={listToRender}
          keyExtractor={(it) => it.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 24, gap: 12 }}
        />
      )}

      <Modal visible={scannerOpen} animationType="slide" onRequestClose={() => setScannerOpen(false)}>
        <View style={{ flex: 1, backgroundColor: '#000' }}>
          <CameraView
            style={{ flex: 1 }}
            facing="back"
            barcodeScannerSettings={{
              barcodeTypes: ['qr', 'ean13', 'ean8', 'code128', 'code39', 'upc_a', 'upc_e', 'itf14', 'pdf417'],
            }}
            onBarcodeScanned={handleBarcodeScanned}
          >
            <View style={styles.overlay}><View style={styles.frame} /></View>
          </CameraView>
          <View style={styles.scannerFooter}>
            <Pressable style={[styles.primaryBtn, { backgroundColor: '#ef4444' }]} onPress={() => setScannerOpen(false)}>
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

  searchCard: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, padding: 12, backgroundColor: '#fff' },
  sectionTitle: { fontSize: 18, fontWeight: '800', marginBottom: 8 },
  label: { fontSize: 13, color: '#333', marginBottom: 6 },

  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 12,
  },

  input: {
    borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 10, fontSize: 16, backgroundColor: '#fff'
  },

  card: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, padding: 12, backgroundColor: '#fff' },
  cardHighlight: { borderColor: '#3b82f6' },
  cardTitle: { fontSize: 16, fontWeight: '700' },
  cardSub: { fontSize: 13, color: '#555', marginTop: 2 },

  primaryBtn: {
    backgroundColor: '#3b82f6',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center'
  },
  primaryText: { color: '#fff', fontWeight: '700', fontSize: 16 },

  btn: {
    backgroundColor: '#3f3f46',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center'
  },
  btnText: { color: '#fff', fontWeight: '600' },

  buttonSmall: {
    backgroundColor: '#3b82f6',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 110,
  },
  buttonSmallText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },

  overlay: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  frame: { width: FRAME, height: FRAME, borderRadius: 16, borderWidth: 3, borderColor: 'rgba(255,255,255,0.9)' },
  scannerFooter: { padding: 16, backgroundColor: '#000' },
});
