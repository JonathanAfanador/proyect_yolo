import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  SafeAreaView, Image, Alert, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { facesApi } from '../services/api';
import type { RegisteredFace } from '../types';

export default function PeopleScreen() {
  const router = useRouter();
  const [people, setPeople] = useState<RegisteredFace[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await facesApi.listRegistered();
      setPeople(data);
    } catch { Alert.alert('Error', 'No se pudo cargar la lista'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleDelete = (id: string, name: string) => {
    Alert.alert('Eliminar', `¿Eliminar a ${name}?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar', style: 'destructive',
        onPress: async () => {
          await facesApi.deleteFace(id);
          setPeople(p => p.filter(f => f.id !== id));
        },
      },
    ]);
  };

  if (loading) return (
    <SafeAreaView style={s.center}><ActivityIndicator size="large" color="#7C3AED" /></SafeAreaView>
  );

  return (
    <SafeAreaView style={s.container}>
      <View style={s.topBar}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={s.topTitle}>Personas registradas</Text>
        <Text style={s.count}>{people.length}</Text>
      </View>
      <FlatList
        data={people}
        keyExtractor={i => i.id}
        contentContainerStyle={{ padding: 16, gap: 10 }}
        onRefresh={load} refreshing={loading}
        renderItem={({ item }) => (
          <View style={s.card}>
            <Image source={{ uri: item.image_url }} style={s.avatar} />
            <View style={s.info}>
              <Text style={s.name}>{item.person_name}</Text>
              <Text style={s.date}>
                {new Date(item.created_at).toLocaleDateString('es-CO', {
                  day: '2-digit', month: 'short', year: 'numeric',
                })}
              </Text>
            </View>
            <TouchableOpacity onPress={() => handleDelete(item.id, item.person_name)}>
              <Ionicons name="trash-outline" size={20} color="#EF4444" />
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={
          <View style={s.empty}>
            <Ionicons name="people-outline" size={56} color="#D1D5DB" />
            <Text style={s.emptyTxt}>Sin personas registradas</Text>
            <TouchableOpacity style={s.addBtn} onPress={() => router.push('/register-face')}>
              <Text style={s.addTxt}>Registrar primera persona</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 16, backgroundColor: '#fff',
    borderBottomWidth: 1, borderBottomColor: '#E5E7EB',
  },
  topTitle: { fontSize: 16, fontWeight: '700', color: '#111827' },
  count: { fontSize: 13, color: '#6B7280' },
  card: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    borderRadius: 12, padding: 12, gap: 12,
    borderWidth: 1, borderColor: '#E5E7EB',
  },
  avatar: { width: 56, height: 56, borderRadius: 28 },
  info: { flex: 1 },
  name: { fontSize: 15, fontWeight: '700', color: '#111827' },
  date: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  empty: { alignItems: 'center', paddingTop: 60, gap: 14 },
  emptyTxt: { fontSize: 15, color: '#9CA3AF' },
  addBtn: { backgroundColor: '#7C3AED', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 10 },
  addTxt: { color: '#fff', fontWeight: '700' },
});
