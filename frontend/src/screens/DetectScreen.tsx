import React, { useState, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView,
  ActivityIndicator, Alert, Image, ScrollView, FlatList,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useDetection } from '../hooks/useDetection';

export default function DetectScreen() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [capturedUri, setCapturedUri] = useState<string | null>(null);
  const [facing, setFacing] = useState<'back' | 'front'>('back');
  const cameraRef = useRef<any>(null);
  const { detect, loading, result, error, reset } = useDetection();

  const takePicture = async () => {
    const photo = await cameraRef.current?.takePictureAsync({ quality: 0.85 });
    if (photo) { setCapturedUri(photo.uri); reset(); }
  };

  const pickImage = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.85,
    });
    if (!res.canceled) { setCapturedUri(res.assets[0].uri); reset(); }
  };

  const analyze = async () => {
    if (!capturedUri) return;
    try { await detect(capturedUri); }
    catch { Alert.alert('Error', error || 'No se pudo analizar'); }
  };

  const handleReset = () => { setCapturedUri(null); reset(); };

  // Resultado
  if (result && capturedUri) {
    return (
      <SafeAreaView style={s.container}>
        <View style={s.topBar}>
          <TouchableOpacity onPress={handleReset}>
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={s.topTitle}>Objetos detectados</Text>
          <View style={[s.badge, { backgroundColor: '#FEF3C7' }]}>
            <Text style={[s.badgeTxt, { color: '#92400E' }]}>{result.total_objects} objetos</Text>
          </View>
        </View>
        <ScrollView>
          <Image source={{ uri: result.annotated_url || capturedUri }}
            style={s.resultImg} resizeMode="contain" />
          <View style={s.statsRow}>
            {[
              { val: result.total_objects, label: 'Objetos' },
              { val: `${Math.round(result.processing_time_ms)}ms`, label: 'Tiempo' },
              { val: result.model_version.replace('.pt',''), label: 'Modelo' },
            ].map(({ val, label }) => (
              <View key={label} style={s.stat}>
                <Text style={s.statVal}>{val}</Text>
                <Text style={s.statLbl}>{label}</Text>
              </View>
            ))}
          </View>
          {result.detections.map((d, i) => (
            <View key={i} style={s.detRow}>
              <Text style={s.detLabel}>{d.label}</Text>
              <View style={s.confBar}>
                <View style={[s.confFill, { width: `${d.confidence * 100}%` as any }]} />
              </View>
              <Text style={s.detConf}>{(d.confidence * 100).toFixed(0)}%</Text>
            </View>
          ))}
        </ScrollView>
        <View style={s.bottomBar}>
          <TouchableOpacity style={s.primaryBtn} onPress={handleReset}>
            <Text style={s.primaryTxt}>Nueva foto</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Preview
  if (capturedUri) {
    return (
      <SafeAreaView style={s.container}>
        <View style={s.topBar}>
          <TouchableOpacity onPress={handleReset}>
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={s.topTitle}>Vista previa</Text>
          <View />
        </View>
        <Image source={{ uri: capturedUri }} style={{ flex: 1 }} resizeMode="contain" />
        <View style={s.bottomBar}>
          <TouchableOpacity style={s.secondaryBtn} onPress={handleReset}>
            <Text style={s.secondaryTxt}>Retomar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.primaryBtn} onPress={analyze} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.primaryTxt}>Detectar</Text>}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Camara
  if (!permission?.granted) {
    return (
      <SafeAreaView style={s.center}>
        <Ionicons name="camera-off-outline" size={56} color="#9CA3AF" />
        <Text style={s.permText}>Se necesita acceso a la camara</Text>
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
        <Text style={s.topTitle}>Detectar objetos</Text>
        <TouchableOpacity onPress={() => setFacing(f => f === 'back' ? 'front' : 'back')}>
          <Ionicons name="camera-reverse-outline" size={24} color="#111827" />
        </TouchableOpacity>
      </View>
      <CameraView ref={cameraRef} style={{ flex: 1 }} facing={facing}>
        <View style={s.frameWrap}>
          <View style={s.frame} />
          <Text style={s.frameHint}>Apunta hacia los objetos</Text>
        </View>
      </CameraView>
      <View style={s.bottomBar}>
        <TouchableOpacity style={s.galleryBtn} onPress={pickImage}>
          <Ionicons name="images-outline" size={24} color="#374151" />
        </TouchableOpacity>
        <TouchableOpacity style={s.captureBtn} onPress={takePicture}>
          <View style={[s.captureInner, { backgroundColor: '#D97706' }]} />
        </TouchableOpacity>
        <View style={{ width: 44 }} />
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, padding: 32 },
  topBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E5E7EB',
  },
  topTitle: { fontSize: 16, fontWeight: '700', color: '#111827' },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgeTxt: { fontSize: 11, fontWeight: '700' },
  frameWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  frame: { width: 260, height: 260, borderWidth: 2, borderColor: '#D97706', borderRadius: 12 },
  frameHint: { color: '#fff', fontSize: 12, fontWeight: '500' },
  bottomBar: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    padding: 24, backgroundColor: '#fff', gap: 20,
    borderTopWidth: 1, borderTopColor: '#E5E7EB',
  },
  captureBtn: {
    width: 70, height: 70, borderRadius: 35,
    borderWidth: 3, borderColor: '#D97706',
    alignItems: 'center', justifyContent: 'center',
  },
  captureInner: { width: 52, height: 52, borderRadius: 26 },
  galleryBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center',
  },
  primaryBtn: {
    backgroundColor: '#D97706', paddingHorizontal: 28, paddingVertical: 14,
    borderRadius: 10, minWidth: 130, alignItems: 'center',
  },
  primaryTxt: { color: '#fff', fontWeight: '700', fontSize: 15 },
  secondaryBtn: { borderWidth: 1.5, borderColor: '#D1D5DB', paddingHorizontal: 24, paddingVertical: 14, borderRadius: 10 },
  secondaryTxt: { color: '#374151', fontWeight: '600', fontSize: 15 },
  permText: { fontSize: 15, color: '#6B7280', textAlign: 'center' },
  resultImg: { width: '100%', height: 280, backgroundColor: '#000' },
  statsRow: { flexDirection: 'row', padding: 16, gap: 10 },
  stat: {
    flex: 1, backgroundColor: '#fff', borderRadius: 10, padding: 12,
    alignItems: 'center', borderWidth: 1, borderColor: '#E5E7EB',
  },
  statVal: { fontSize: 17, fontWeight: '700', color: '#1F2937' },
  statLbl: { fontSize: 11, color: '#6B7280', marginTop: 2 },
  detRow: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16,
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
    backgroundColor: '#fff', gap: 10,
  },
  detLabel: { fontSize: 14, fontWeight: '600', color: '#1F2937', width: 100, textTransform: 'capitalize' },
  confBar: { flex: 1, height: 6, backgroundColor: '#F3F4F6', borderRadius: 3, overflow: 'hidden' },
  confFill: { height: 6, backgroundColor: '#D97706', borderRadius: 3 },
  detConf: { fontSize: 13, fontWeight: '700', color: '#D97706', width: 40, textAlign: 'right' },
});
