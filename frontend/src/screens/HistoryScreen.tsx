import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  SafeAreaView, Image, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { detectionApi, facesApi } from '../services/api';

export default function HistoryScreen() {
  const router = useRouter();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'objects' | 'faces'>('objects');

  const load = async (t: 'objects' | 'faces') => {
    setLoading(true);
    try {
      const { data } = t === 'objects'
        ? await detectionApi.getHistory(30)
        : await facesApi.getHistory(30);
      setItems(data);
    } catch { setItems([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(tab); }, [tab]);

  return (
    <SafeAreaView style={s.container}>
      <View style={s.topBar}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={s.topTitle}>Historial</Text>
        <Text style={s.count}>{items.length}</Text>
      </View>
      <View style={s.tabs}>
        <TouchableOpacity
          style={[s.tab, tab === 'objects' && s.tabActive]}
          onPress={() => setTab('objects')}>
          <Ionicons name="scan-outline" size={16}
            color={tab === 'objects' ? '#D97706' : '#6B7280'} />
          <Text style={[s.tabTxt, tab === 'objects' && { color: '#D97706' }]}>Objetos</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.tab, tab === 'faces' && s.tabActive]}
          onPress={() => setTab('faces')}>
          <Ionicons name="person-circle-outline" size={16}
            color={tab === 'faces' ? '#7C3AED' : '#6B7280'} />
          <Text style={[s.tabTxt, tab === 'faces' && { color: '#7C3AED' }]}>Rostros</Text>
        </TouchableOpacity>
      </View>
      {loading
        ? <ActivityIndicator style={{ flex: 1 }} size="large"
            color={tab === 'objects' ? '#D97706' : '#7C3AED'} />
        : <FlatList
            data={items}
            keyExtractor={i => i.id}
            contentContainerStyle={{ padding: 16, gap: 10 }}
            renderItem={({ item }) => (
              <View style={s.card}>
                <Image
                  source={{ uri: item.annotated_url || item.image_url }}
                  style={s.thumb}
                />
                <View style={s.info}>
                  <Text style={s.objCount}>
                    {tab === 'objects'
                      ? `${item.total_objects} objetos`
                      : `${item.faces_found} rostros`}
                  </Text>
                  <Text style={s.time}>{Math.round(item.processing_time_ms)}ms</Text>
                  <Text style={s.date}>
                    {new Date(item.created_at).toLocaleDateString('es-CO', {
                      day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
                    })}
                  </Text>
                </View>
              </View>
            )}
            ListEmptyComponent={
              <View style={s.empty}>
                <Ionicons name="time-outline" size={56} color="#D1D5DB" />
                <Text style={s.emptyTxt}>Sin registros aun</Text>
              </View>
            }
          />
      }
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 16, backgroundColor: '#fff',
    borderBottomWidth: 1, borderBottomColor: '#E5E7EB',
  },
  topTitle: { fontSize: 16, fontWeight: '700', color: '#111827' },
  count: { fontSize: 13, color: '#6B7280' },
  tabs: { flexDirection: 'row', backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  tab: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 12, gap: 6,
  },
  tabActive: { borderBottomWidth: 2, borderBottomColor: '#D97706' },
  tabTxt: { fontSize: 14, fontWeight: '600', color: '#6B7280' },
  card: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#E5E7EB',
  },
  thumb: { width: 80, height: 80 },
  info: { flex: 1, padding: 12, gap: 3 },
  objCount: { fontSize: 14, fontWeight: '700', color: '#1F2937' },
  time: { fontSize: 12, color: '#059669', fontWeight: '600' },
  date: { fontSize: 11, color: '#9CA3AF' },
  empty: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyTxt: { fontSize: 15, color: '#9CA3AF' },
});
