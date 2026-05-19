import React, { useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  SafeAreaView, StatusBar, ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../store/authStore';

const MENU = [
  {
    icon: 'scan-outline',
    label: 'Detectar objetos',
    desc: 'Identifica hasta 80 tipos de objetos con YOLOv8',
    route: '/detect',
    color: '#D97706',
    bg: '#FEF3C7',
  },
  {
    icon: 'person-circle-outline',
    label: 'Reconocer personas',
    desc: 'Identifica quién aparece en la foto con YOLO + DeepFace',
    route: '/recognize',
    color: '#7C3AED',
    bg: '#F5F3FF',
  },
  {
    icon: 'person-add-outline',
    label: 'Registrar persona',
    desc: 'Agrega una nueva persona a la base de datos facial',
    route: '/register-face',
    color: '#2563EB',
    bg: '#EFF6FF',
  },
  {
    icon: 'people-outline',
    label: 'Personas registradas',
    desc: 'Gestiona los rostros guardados en el sistema',
    route: '/people',
    color: '#059669',
    bg: '#ECFDF5',
  },
  {
    icon: 'time-outline',
    label: 'Historial',
    desc: 'Detecciones y reconocimientos anteriores',
    route: '/history',
    color: '#6B7280',
    bg: '#F9FAFB',
  },
];

export default function HomeScreen() {
  const router = useRouter();
  const { user, logout, initialize } = useAuthStore();
  useEffect(() => { initialize(); }, []);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#1A1A2E" />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>CNN Unified</Text>
          <Text style={styles.headerSub}>
            Hola, {user?.user_metadata?.full_name || 'Usuario'}
          </Text>
        </View>
        <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
          <Ionicons name="log-out-outline" size={22} color="#AAAAAA" />
        </TouchableOpacity>
      </View>

      {/* Badges de tecnología */}
      <View style={styles.badges}>
        {['YOLOv8', 'DeepFace', 'FastAPI', 'Supabase'].map((t) => (
          <View key={t} style={styles.badge}>
            <Text style={styles.badgeText}>{t}</Text>
          </View>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {MENU.map((item) => (
          <TouchableOpacity
            key={item.route}
            style={[styles.card, { borderLeftColor: item.color }]}
            onPress={() => router.push(item.route as any)}
            activeOpacity={0.75}
          >
            <View style={[styles.iconWrap, { backgroundColor: item.bg }]}>
              <Ionicons name={item.icon as any} size={26} color={item.color} />
            </View>
            <View style={styles.cardText}>
              <Text style={styles.cardTitle}>{item.label}</Text>
              <Text style={styles.cardDesc}>{item.desc}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#D1D5DB" />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F9FAFB' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#1A1A2E', paddingHorizontal: 20, paddingVertical: 18,
  },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#FFFFFF' },
  headerSub: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  logoutBtn: { padding: 8 },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, padding: 14, backgroundColor: '#1A1A2E' },
  badge: {
    backgroundColor: '#2D2D44', paddingHorizontal: 10,
    paddingVertical: 4, borderRadius: 12,
  },
  badgeText: { fontSize: 11, color: '#A5B4FC', fontWeight: '600' },
  scroll: { padding: 16, gap: 12 },
  card: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF',
    borderRadius: 12, padding: 16, borderLeftWidth: 4,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  iconWrap: {
    width: 48, height: 48, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center', marginRight: 14,
  },
  cardText: { flex: 1 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#111827' },
  cardDesc: { fontSize: 12, color: '#6B7280', marginTop: 2, lineHeight: 16 },
});
