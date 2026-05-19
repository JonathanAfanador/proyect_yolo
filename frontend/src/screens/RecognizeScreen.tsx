import React, { useState, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView,
  ActivityIndicator, Alert, Image, ScrollView,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useFaceRecognition } from '../hooks/useFaceRecognition';

export default function RecognizeScreen() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [capturedUri, setCapturedUri] = useState<string | null>(null);
  const cameraRef = useRef<any>(null);
  const { recognize, loading, result, error, reset } = useFaceRecognition();

  const takePicture = async () => {
    const photo = await cameraRef.current?.takePictureAsync({ quality: 0.9 });
    if (photo) { setCapturedUri(photo.uri); reset(); }
  };

  const pickImage = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.9,
    });
    if (!res.canceled) { setCapturedUri(res.assets[0].uri); reset(); }
  };

  const analyze = async () => {
    if (!capturedUri) return;
    try { await recognize(capturedUri); }
    catch { Alert.alert('Error', error || 'No se pudo procesar'); }
  };

  const handleReset = () => { setCapturedUri(null); reset(); };
  const verified = result?.matches.filter(m => m.verified) ?? [];

  // Resultado
  if (result && capturedUri) {
    return (
      <SafeAreaView style={s.container}>
        <View style={s.topBar}>
          <TouchableOpacity onPress={handleReset}>
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={s.topTitle}>Reconocimiento facial</Text>
          <View style={[s.badge,
            { backgroundColor: verified.length > 0 ? '#D1FAE5' : '#FEE2E2' }]}>
            <Text style={[s.badgeTxt,
              { color: verified.length > 0 ? '#065F46' : '#991B1B' }]}>
              {verified.length > 0 ? 'Identificado' : 'No encontrado'}
            </Text>
          </View>
        </View>
        <ScrollView>
          <Image source={{ uri: result.image_url || capturedUri }}
            style={s.resultImg} resizeMode="contain" />
          <View style={s.statsRow}>
            {[
              { val: result.faces_found, label: 'Rostros' },
              { val: verified.length, label: 'Identificados' },
              { val: `${Math.round(result.processing_time_ms)}ms`, label: 'Tiempo' },
            ].map(({ val, label }) => (
              <View key={label} style={s.stat}>
                <Text style={s.statVal}>{val}</Text>
                <Text style={s.statLbl}>{label}</Text>
              </View>
            ))}
          </View>
          {result.matches.length === 0 && (
            <View style={s.emptyMatch}>
              <Ionicons name="person-outline" size={48} color="#D1D5DB" />
              <Text style={s.emptyTxt}>Ninguna persona registrada fue encontrada</Text>
            </View>
          )}
          {result.matches.map((m, i) => (
            <View key={i} style={[s.matchCard, { borderLeftColor: m.verified ? '#10B981' : '#EF4444' }]}>
              <Ionicons
                name={m.verified ? 'checkmark-circle' : 'close-circle'}
                size={28} color={m.verified ? '#10B981' : '#EF4444'}
              />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={s.matchName}>{m.person_name}</Text>
                <Text style={s.matchSub}>
                  Similitud: {(m.similarity * 100).toFixed(1)}%
                  {'  '}Distancia: {m.distance.toFixed(3)}
                </Text>
              </View>
              <View style={[s.verBadge,
                { backgroundColor: m.verified ? '#D1FAE5' : '#FEE2E2' }]}>
                <Text style={[s.verTxt,
                  { color: m.verified ? '#065F46' : '#991B1B' }]}>
                  {m.verified ? 'OK' : 'No'}
                </Text>
              </View>
            </View>
          ))}
        </ScrollView>
        <View style={s.bottomBar}>
          <TouchableOpacity style={s.primaryBtn} onPress={handleReset}>
            <Text style={s.primaryTxt}>Nueva captura</Text>
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
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.primaryTxt}>Reconocer</Text>}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (!permission?.granted) {
    return (
      <SafeAreaView style={s.center}>
        <Ionicons name="person-circle-outline" size={56} color="#9CA3AF" />
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
        <Text style={s.topTitle}>Reconocer personas</Text>
        <View />
      </View>
      <CameraView ref={cameraRef} style={{ flex: 1 }} facing="front">
        <View style={s.frameWrap}>
          <View style={s.ovalFrame} />
          <Text style={s.frameHint}>Centra el rostro en el ovalo</Text>
        </View>
      </CameraView>
      <View style={s.bottomBar}>
        <TouchableOpacity style={s.galleryBtn} onPress={pickImage}>
          <Ionicons name="images-outline" size={24} color="#374151" />
        </TouchableOpacity>
        <TouchableOpacity style={s.captureBtn} onPress={takePicture}>
          <View style={[s.captureInner, { backgroundColor: '#7C3AED' }]} />
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
  frameWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14 },
  ovalFrame: {
    width: 220, height: 290, borderRadius: 110,
    borderWidth: 2.5, borderColor: '#7C3AED', borderStyle: 'dashed',
  },
  frameHint: { color: '#fff', fontSize: 12, fontWeight: '500' },
  bottomBar: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    padding: 24, backgroundColor: '#fff', gap: 20,
    borderTopWidth: 1, borderTopColor: '#E5E7EB',
  },
  captureBtn: {
    width: 70, height: 70, borderRadius: 35,
    borderWidth: 3, borderColor: '#7C3AED',
    alignItems: 'center', justifyContent: 'center',
  },
  captureInner: { width: 52, height: 52, borderRadius: 26 },
  galleryBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center',
  },
  primaryBtn: {
    backgroundColor: '#7C3AED', paddingHorizontal: 28, paddingVertical: 14,
    borderRadius: 10, minWidth: 130, alignItems: 'center',
  },
  primaryTxt: { color: '#fff', fontWeight: '700', fontSize: 15 },
  secondaryBtn: { borderWidth: 1.5, borderColor: '#D1D5DB', paddingHorizontal: 24, paddingVertical: 14, borderRadius: 10 },
  secondaryTxt: { color: '#374151', fontWeight: '600', fontSize: 15 },
  permText: { fontSize: 15, color: '#6B7280', textAlign: 'center' },
  resultImg: { width: '100%', height: 300, backgroundColor: '#000' },
  statsRow: { flexDirection: 'row', padding: 16, gap: 10 },
  stat: {
    flex: 1, backgroundColor: '#fff', borderRadius: 10, padding: 12,
    alignItems: 'center', borderWidth: 1, borderColor: '#E5E7EB',
  },
  statVal: { fontSize: 17, fontWeight: '700', color: '#1F2937' },
  statLbl: { fontSize: 11, color: '#6B7280', marginTop: 2 },
  matchCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    marginHorizontal: 16, marginBottom: 8, borderRadius: 10,
    padding: 14, borderLeftWidth: 4,
  },
  matchName: { fontSize: 15, fontWeight: '700', color: '#1F2937' },
  matchSub: { fontSize: 11, color: '#6B7280', marginTop: 3 },
  verBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  verTxt: { fontSize: 11, fontWeight: '700' },
  emptyMatch: { alignItems: 'center', padding: 32, gap: 12 },
  emptyTxt: { fontSize: 14, color: '#9CA3AF', textAlign: 'center' },
});
