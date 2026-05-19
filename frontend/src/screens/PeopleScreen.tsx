import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  Image, ActivityIndicator, Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { facesApi } from '../services/api';
import type { RegisteredFace } from '../types';
import { CustomAlert } from '../components/CustomAlert';

export default function PeopleScreen() {
  const router = useRouter();
  const [people, setPeople] = useState<RegisteredFace[]>([]);
  const [loading, setLoading] = useState(true);
  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    type: 'error' as 'error' | 'warning' | 'success',
    title: '',
    message: '',
    confirmText: 'Aceptar',
    cancelText: 'Cancelar',
    onConfirm: undefined as (() => Promise<void> | void) | undefined,
  });

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await facesApi.listRegistered();
      setPeople(data);
    } catch {
      setAlertConfig({
        visible: true,
        type: 'error',
        title: 'Error de carga',
        message: 'No se pudo cargar la lista de personas registradas.',
        confirmText: 'Aceptar',
        cancelText: 'Cancelar',
        onConfirm: undefined,
      });
    }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleDelete = (id: string, name: string) => {
    setAlertConfig({
      visible: true,
      type: 'warning',
      title: 'Eliminar persona',
      message: `¿Estás seguro de eliminar a ${name} del sistema? Esta acción no se puede deshacer.`,
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      onConfirm: async () => {
        try {
          await facesApi.deleteFace(id);
          setPeople(p => p.filter(f => f.id !== id));
          setAlertConfig(prev => ({ ...prev, visible: false }));
        } catch {
          setAlertConfig({
            visible: true,
            type: 'error',
            title: 'Error',
            message: 'No se pudo eliminar el rostro de la base de datos.',
            confirmText: 'Aceptar',
            cancelText: 'Cancelar',
            onConfirm: undefined,
          });
        }
      }
    });
  };

  if (loading) return (
    <SafeAreaView style={s.center}><ActivityIndicator size="large" color="#7C3AED" /></SafeAreaView>
  );

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <View style={s.topBar}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color="#111827" />
        </TouchableOpacity>
        <Text style={s.topTitle}>Personas Registradas</Text>
        <View style={s.badgeCount}>
          <Text style={s.countTxt}>{people.length}</Text>
        </View>
      </View>
      
      <FlatList
        data={people}
        keyExtractor={i => i.id}
        contentContainerStyle={{ padding: 20, gap: 14 }}
        onRefresh={load} refreshing={loading}
        renderItem={({ item }) => (
          <View style={s.card}>
            <Image source={{ uri: item.image_url }} style={s.avatar} />
            <View style={s.info}>
              <Text style={s.name}>{item.person_name}</Text>
              <Text style={s.date}>
                <Ionicons name="calendar-outline" size={12} color="#9CA3AF" />{' '}
                {new Date(item.created_at).toLocaleDateString('es-CO', {
                  day: '2-digit', month: 'short', year: 'numeric',
                })}
              </Text>
            </View>
            <TouchableOpacity style={s.deleteBtn} onPress={() => handleDelete(item.id, item.person_name)}>
              <Ionicons name="trash" size={20} color="#EF4444" />
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={
          <View style={s.empty}>
            <View style={s.emptyCircle}>
              <Ionicons name="people-outline" size={48} color="#9CA3AF" />
            </View>
            <Text style={s.emptyTitle}>Ningún registro encontrado</Text>
            <Text style={s.emptyTxt}>Agrega rostros para que el sistema de reconocimiento los identifique.</Text>
            <TouchableOpacity style={s.addBtn} onPress={() => router.push('/register-face')}>
              <Ionicons name="add-circle-outline" size={20} color="#fff" />
              <Text style={s.addTxt}>Registrar persona</Text>
            </TouchableOpacity>
          </View>
        }
      />
      <CustomAlert
        visible={alertConfig.visible}
        type={alertConfig.type}
        title={alertConfig.title}
        message={alertConfig.message}
        confirmText={alertConfig.confirmText}
        cancelText={alertConfig.cancelText}
        onConfirm={alertConfig.onConfirm}
        onClose={() => setAlertConfig(prev => ({ ...prev, visible: false }))}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F9FAFB' },
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#FFFFFF',
    paddingTop: Platform.OS === 'android' ? 10 : 14,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 3, zIndex: 10
  },
  backBtn: { padding: 4, marginLeft: -4 },
  topTitle: { fontSize: 18, fontWeight: '800', color: '#111827', flex: 1, textAlign: 'center' },
  badgeCount: { backgroundColor: '#F3F4F6', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  countTxt: { fontSize: 13, fontWeight: '700', color: '#4B5563' },
  
  card: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF',
    borderRadius: 16, padding: 14, gap: 14,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
    borderWidth: 1, borderColor: '#F3F4F6'
  },
  avatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#E5E7EB' },
  info: { flex: 1, justifyContent: 'center' },
  name: { fontSize: 16, fontWeight: '700', color: '#1F2937', marginBottom: 4 },
  date: { fontSize: 13, color: '#6B7280', fontWeight: '500' },
  deleteBtn: { padding: 10, backgroundColor: '#FEF2F2', borderRadius: 12 },
  
  empty: { alignItems: 'center', paddingTop: 80, gap: 16, paddingHorizontal: 20 },
  emptyCircle: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#1F2937' },
  emptyTxt: { fontSize: 14, color: '#6B7280', textAlign: 'center', lineHeight: 20, paddingHorizontal: 10 },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#7C3AED', paddingHorizontal: 24, paddingVertical: 14, borderRadius: 12, marginTop: 10 },
  addTxt: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
