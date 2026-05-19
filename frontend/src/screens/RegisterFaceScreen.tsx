import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  SafeAreaView, Image, Alert, ActivityIndicator,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useFaceRecognition } from '../hooks/useFaceRecognition';

export default function RegisterFaceScreen() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [capturedUri, setCapturedUri] = useState<string | null>(null);
  const [personName, setPersonName] = useState('');
  const [success, setSuccess] = useState(false);
  const cameraRef = useRef<any>(null);
  const { registerFace, loading, error } = useFaceRecognition();

  const takePicture = async () => {
    const photo = await cameraRef.current?.takePictureAsync({ quality: 0.9 });
    if (photo) setCapturedUri(photo.uri);
  };

  const handleRegister = async () => {
    if (!capturedUri || !personName.trim()) {
      Alert.alert('Faltan datos', 'Ingresa el nombre y toma una foto'); return;
    }
    try {
      await registerFace(capturedUri, personName.trim());
      setSuccess(true);
    } catch {
      Alert.alert('Error', error || 'Asegurate de que el rostro sea visible y bien iluminado');
    }
  };

  if (success) {
    return (
      <SafeAreaView style={s.center}>
        <Ionicons name="checkmark-circle" size={72} color="#10B981" />
        <Text style={s.successTitle}>Persona registrada</Text>
        <Text style={s.successSub}>{personName} fue agregado al sistema facial</Text>
        <TouchableOpacity style={s.primaryBtn} onPress={() => router.back()}>
          <Text style={s.primaryTxt}>Volver al inicio</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.secondaryBtn}
          onPress={() => { setSuccess(false); setCapturedUri(null); setPersonName(''); }}>
          <Text style={s.secondaryTxt}>Registrar otra persona</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (!permission?.granted) {
    return (
      <SafeAreaView style={s.center}>
        <Text style={{ color: '#6B7280', marginBottom: 16 }}>Se necesita acceso a la camara</Text>
        <TouchableOpacity style={s.primaryBtn} onPress={requestPermission}>
          <Text style={s.primaryTxt}>Permitir</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.container}>
      <View style={s.topBar}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={s.topTitle}>Registrar persona</Text>
        <View />
      </View>
      <View style={s.form}>
        <Text style={s.label}>Nombre completo</Text>
        <TextInput
          style={s.input} value={personName} onChangeText={setPersonName}
          placeholder="Ej: Juan Perez" placeholderTextColor="#9CA3AF"
        />
      </View>
      {capturedUri ? (
        <View style={{ flex: 1 }}>
          <Image source={{ uri: capturedUri }} style={{ flex: 1 }} resizeMode="contain" />
          <TouchableOpacity style={s.retakeBtn} onPress={() => setCapturedUri(null)}>
            <Ionicons name="refresh" size={16} color="#374151" />
            <Text style={s.retakeTxt}>Retomar foto</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <CameraView ref={cameraRef} style={{ flex: 1 }} facing="front">
          <View style={s.frameWrap}>
            <View style={s.guideOval} />
            <Text style={s.guideHint}>Foto frontal, buena iluminacion</Text>
          </View>
        </CameraView>
      )}
      <View style={s.bottomBar}>
        {!capturedUri ? (
          <TouchableOpacity style={s.captureBtn} onPress={takePicture}>
            <View style={[s.captureInner, { backgroundColor: '#2563EB' }]} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[s.primaryBtn, { flex: 1 }]}
            onPress={handleRegister} disabled={loading}>
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={s.primaryTxt}>Registrar rostro</Text>}
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 16 },
  topBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E5E7EB',
  },
  topTitle: { fontSize: 16, fontWeight: '700', color: '#111827' },
  form: { padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6 },
  input: {
    borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 10,
    padding: 12, fontSize: 16, color: '#111827',
  },
  frameWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14 },
  guideOval: { width: 200, height: 260, borderRadius: 100, borderWidth: 2, borderColor: '#2563EB', borderStyle: 'dashed' },
  guideHint: { color: '#fff', fontSize: 12 },
  bottomBar: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    padding: 24, backgroundColor: '#fff', gap: 16,
    borderTopWidth: 1, borderTopColor: '#E5E7EB',
  },
  captureBtn: {
    width: 70, height: 70, borderRadius: 35,
    borderWidth: 3, borderColor: '#2563EB', alignItems: 'center', justifyContent: 'center',
  },
  captureInner: { width: 52, height: 52, borderRadius: 26 },
  primaryBtn: {
    backgroundColor: '#2563EB', paddingHorizontal: 28, paddingVertical: 14,
    borderRadius: 10, alignItems: 'center', minWidth: 160,
  },
  primaryTxt: { color: '#fff', fontWeight: '700', fontSize: 15 },
  secondaryBtn: { borderWidth: 1.5, borderColor: '#D1D5DB', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 10 },
  secondaryTxt: { color: '#374151', fontWeight: '600' },
  retakeBtn: {
    position: 'absolute', bottom: 16, alignSelf: 'center',
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: 20, borderWidth: 1, borderColor: '#D1D5DB',
  },
  retakeTxt: { fontSize: 13, color: '#374151' },
  successTitle: { fontSize: 22, fontWeight: '700', color: '#111827' },
  successSub: { fontSize: 14, color: '#6B7280', textAlign: 'center' },
});
