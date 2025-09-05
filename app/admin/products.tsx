import { CameraView, useCameraPermissions } from 'expo-camera';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

type Product = {
  id: string;
  code: string;
  name: string;
  price?: number;
};

// Datos locales, se mantienen en memoria
const initialProducts: Product[] = [
  { id: 'p1', code: 'EAN13-7791234567890', name: 'Botella de agua 500ml', price: 1200 },
  { id: 'p2', code: 'QR-ABC-001', name: 'Cuaderno rayado A4', price: 3500 },
];

export default function ProductsScreen() {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [loading, setLoading] = useState(false);

  // Form state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [price, setPrice] = useState<string>('');

  // Scanner
  const [permission, requestPermission] = useCameraPermissions();
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scanLock, setScanLock] = useState(false);

  useEffect(() => {
    // pedir permiso si abre el escáner
    if (scannerOpen && (!permission || !permission.granted)) {
      requestPermission();
    }
  }, [scannerOpen]);

  // Helpers
  const resetForm = () => {
    setEditingId(null);
    setCode('');
    setName('');
    setPrice('');
  };

  const fillFormForEdit = (p: Product) => {
    setEditingId(p.id);
    setCode(p.code);
    setName(p.name);
    setPrice(p.price ? String(p.price) : '');
  };

  const validate = () => {
    if (!code.trim()) {
      Alert.alert('Datos incompletos', 'Ingresá o escaneá un código.');
      return false;
    }
    if (!name.trim()) {
      Alert.alert('Datos incompletos', 'Ingresá un nombre.');
      return false;
    }
    const priceNum = price.trim() ? Number(price) : undefined;
    if (price.trim() && Number.isNaN(priceNum)) {
      Alert.alert('Precio inválido', 'El precio debe ser numérico.');
      return false;
    }
    return true;
  };

  const onSave = async () => {
    try {
      if (!validate()) return;
      setLoading(true);

      const priceNum = price.trim() ? Number(price) : undefined;

      if (editingId) {
        // Modificar producto
        setProducts((prev) =>
          prev.map((p) => (p.id === editingId ? { ...p, code: code.trim(), name: name.trim(), price: priceNum } : p))
        );
        resetForm();
        Alert.alert('Éxito', 'Producto modificado correctamente.');
      } else {
        // crear producto
        const newProduct: Product = {
          id: `p-${Date.now()}`,
          code: code.trim(),
          name: name.trim(),
          price: priceNum,
        };
        setProducts((prev) => [newProduct, ...prev]);
        resetForm();
        Alert.alert('Éxito', 'Producto agregado correctamente.');
      }
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'No se pudo guardar el producto.');
    } finally {
      setLoading(false);
    }
  };

  const onDelete = (id: string) => {
    Alert.alert('Eliminar', '¿Seguro que querés eliminar este producto?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: () => {
          setProducts((prev) => prev.filter((p) => p.id !== id));
          if (editingId === id) resetForm();
          Alert.alert('Éxito', 'Producto eliminado.');
        },
      },
    ]);
  };

  // Scaner
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

  const handleBarcodeScanned = (result: { data: string; type: string }) => {
    if (scanLock) return;
    setScanLock(true);

    try {
      const parsed = `${result.type}-${result.data}`;
      setCode(parsed);
      Alert.alert('Código leído', parsed);
      setScannerOpen(false);
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'No se pudo interpretar el código.');
      setScanLock(false);
    }
  };

  const renderItem = ({ item }: { item: Product }) => (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{item.name}</Text>
      <Text style={styles.cardSub}>Código: {item.code}</Text>
      <Text style={styles.cardSub}>Precio: {item.price != null ? `$ ${item.price}` : '-'}</Text>

      <View style={styles.row}>
        <Pressable style={[styles.btn, { backgroundColor: '#64748b' }]} onPress={() => fillFormForEdit(item)}>
          <Text style={styles.btnText}>Editar</Text>
        </Pressable>
        <Pressable style={[styles.btn, { backgroundColor: '#ef4444' }]} onPress={() => onDelete(item.id)}>
          <Text style={styles.btnText}>Eliminar</Text>
        </Pressable>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>{editingId ? 'Modificar producto' : 'Agregar producto'}</Text>

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
          <Pressable style={[styles.btn, { backgroundColor: '#10b981', paddingHorizontal: 12 }]} onPress={openScanner}>
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

      <View style={styles.row}>
        <Pressable
          style={[styles.primaryBtn, loading && { opacity: 0.7 }]}
          onPress={onSave}
          disabled={loading}
        >
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryText}>{editingId ? 'Guardar cambios' : 'Agregar'}</Text>}
        </Pressable>

        {editingId && (
          <Pressable style={[styles.btn, { backgroundColor: '#94a3b8' }]} onPress={resetForm}>
            <Text style={styles.btnText}>Cancelar</Text>
          </Pressable>
        )}
      </View>
      <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Productos</Text>
      <FlatList
        data={products}
        keyExtractor={(it) => it.id}
        renderItem={renderItem}
        ListEmptyComponent={<Text style={{ color: '#666' }}>No hay productos cargados.</Text>}
        contentContainerStyle={{ paddingBottom: 24, gap: 12 }}
      />
      <Modal visible={scannerOpen} animationType="slide" onRequestClose={() => setScannerOpen(false)}>
        <View style={{ flex: 1, backgroundColor: '#000' }}>
          <CameraView
            style={{ flex: 1 }}
            facing="back"
            barcodeScannerSettings={{
              // tipos de códigos soportados
              barcodeTypes: ['qr', 'ean13', 'ean8', 'code128', 'code39', 'upc_a', 'upc_e', 'itf14', 'pdf417'],
            }}
            onBarcodeScanned={(event) => {
              // @ts-ignore
              if (event && event.data && event.type) {
                handleBarcodeScanned({ data: event.data, type: event.type });
              // @ts-ignore
              } else if (Array.isArray(event?.barcodes) && event.barcodes.length > 0) {
                // @ts-ignore
                const b = event.barcodes[0];
                handleBarcodeScanned({ data: b.data, type: b.type });
              }
            }}
          >
            <View style={styles.overlay}>
              <View style={styles.frame} />
            </View>
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
  sectionTitle: { fontSize: 18, fontWeight: '800', marginBottom: 8 },
  formRow: { marginBottom: 10 },
  label: { fontSize: 13, color: '#333', marginBottom: 6 },
  input: {
    borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 10, fontSize: 16, backgroundColor: '#fff'
  },
  codeRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4 },

  primaryBtn: {
    backgroundColor: '#3b82f6', paddingVertical: 12, paddingHorizontal: 16,
    borderRadius: 10, alignItems: 'center', justifyContent: 'center'
  },
  primaryText: { color: '#fff', fontWeight: '700', fontSize: 16 },

  btn: {
    backgroundColor: '#3f3f46', paddingVertical: 10, paddingHorizontal: 12,
    borderRadius: 10, alignItems: 'center', justifyContent: 'center'
  },
  btnText: { color: '#fff', fontWeight: '600' },

  card: {
    borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, padding: 12, backgroundColor: '#fff',
  },
  cardTitle: { fontSize: 16, fontWeight: '700' },
  cardSub: { fontSize: 13, color: '#555', marginTop: 2 },

  overlay: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  frame: { width: FRAME, height: FRAME, borderRadius: 16, borderWidth: 3, borderColor: 'rgba(255,255,255,0.9)' },

  scannerFooter: { padding: 16, backgroundColor: '#000' },
});
