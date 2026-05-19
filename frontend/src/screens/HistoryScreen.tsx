import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  Image, ActivityIndicator, Platform, Modal, ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { detectionApi, facesApi } from '../services/api';

export default function HistoryScreen() {
  const router = useRouter();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'objects' | 'faces'>('objects');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'custom'>('all');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [page, setPage] = useState(1);

  // Detalle Modal
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [showAnnotated, setShowAnnotated] = useState(true);
  const [detailData, setDetailData] = useState<any | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Calendario Modal
  const [calendarVisible, setCalendarVisible] = useState(false);
  const [currentCalendarMonth, setCurrentCalendarMonth] = useState<Date>(new Date());

  const load = async (t: 'objects' | 'faces') => {
    setLoading(true);
    try {
      const { data } = t === 'objects'
        ? await detectionApi.getHistory(100)
        : await facesApi.getHistory(100);
      setItems(data);
    } catch { setItems([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { 
    setPage(1);
    load(tab); 
  }, [tab]);

  useEffect(() => {
    setPage(1);
  }, [dateFilter, selectedDate]);

  const openDetail = async (item: any) => {
    setSelectedItem(item);
    setShowAnnotated(true);
    setDetailData(null);
    setModalVisible(true);
    
    if (tab === 'objects') {
      setLoadingDetail(true);
      try {
        const { data } = await detectionApi.getDetail(item.id);
        setDetailData(data);
      } catch (e) {
        console.warn("Error al cargar detalles de la detección:", e);
      } finally {
        setLoadingDetail(false);
      }
    }
  };

  const getFilteredItems = () => {
    const now = new Date();
    return items.filter(item => {
      const itemDate = new Date(item.created_at);
      
      if (dateFilter === 'today') {
        return itemDate.toDateString() === now.toDateString();
      }
      if (dateFilter === 'week') {
        const diffTime = Math.abs(now.getTime() - itemDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays <= 7;
      }
      if (dateFilter === 'custom' && selectedDate) {
        return itemDate.toDateString() === selectedDate.toDateString();
      }
      return true;
    });
  };

  // Generador de días para la cuadrícula del calendario
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    
    const days = [];
    // Días vacíos para completar la primera semana
    for (let i = 0; i < firstDayIndex; i++) {
      days.push(null);
    }
    // Días del mes actual
    for (let i = 1; i <= totalDays; i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  };

  const handlePrevMonth = () => {
    setCurrentCalendarMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentCalendarMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const selectCalendarDate = (date: Date) => {
    setSelectedDate(date);
    setDateFilter('custom');
    setCalendarVisible(false);
  };

  const clearCalendarFilter = () => {
    setSelectedDate(null);
    setDateFilter('all');
  };

  const filteredItems = getFilteredItems();
  const totalPages = Math.max(1, Math.ceil(filteredItems.length / 10));
  const paginatedItems = filteredItems.slice((page - 1) * 10, page * 10);

  const calendarDays = getDaysInMonth(currentCalendarMonth);
  const weekDays = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];
  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      {/* TopBar */}
      <View style={s.topBar}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color="#111827" />
        </TouchableOpacity>
        <Text style={s.topTitle}>Historial de Capturas</Text>
        <View style={s.badgeCount}>
          <Text style={s.countTxt}>{filteredItems.length}</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={s.tabs}>
        <TouchableOpacity
          style={[s.tab, tab === 'objects' && s.tabActiveObjects]}
          onPress={() => { setTab('objects'); clearCalendarFilter(); }}>
          <Ionicons name="cube-outline" size={18}
            color={tab === 'objects' ? '#D97706' : '#6B7280'} />
          <Text style={[s.tabTxt, tab === 'objects' && { color: '#D97706', fontWeight: '800' }]}>Objetos</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.tab, tab === 'faces' && s.tabActiveFaces]}
          onPress={() => { setTab('faces'); clearCalendarFilter(); }}>
          <Ionicons name="person-circle-outline" size={18}
            color={tab === 'faces' ? '#7C3AED' : '#6B7280'} />
          <Text style={[s.tabTxt, tab === 'faces' && { color: '#7C3AED', fontWeight: '800' }]}>Rostros</Text>
        </TouchableOpacity>
      </View>

      {/* Filtros por fecha */}
      <View style={s.filtersContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          <TouchableOpacity 
            style={[s.filterChip, dateFilter === 'all' && s.filterChipActive]}
            onPress={() => { setDateFilter('all'); setSelectedDate(null); }}
          >
            <Text style={[s.filterChipTxt, dateFilter === 'all' && s.filterChipActiveTxt]}>Todos</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[s.filterChip, dateFilter === 'today' && s.filterChipActive]}
            onPress={() => { setDateFilter('today'); setSelectedDate(null); }}
          >
            <Text style={[s.filterChipTxt, dateFilter === 'today' && s.filterChipActiveTxt]}>Hoy</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[s.filterChip, dateFilter === 'week' && s.filterChipActive]}
            onPress={() => { setDateFilter('week'); setSelectedDate(null); }}
          >
            <Text style={[s.filterChipTxt, dateFilter === 'week' && s.filterChipActiveTxt]}>Últimos 7 días</Text>
          </TouchableOpacity>

          {selectedDate && dateFilter === 'custom' && (
            <TouchableOpacity 
              style={[s.filterChip, s.filterChipActive, { flexDirection: 'row', alignItems: 'center', gap: 6 }]}
              onPress={clearCalendarFilter}
            >
              <Text style={s.filterChipActiveTxt}>
                📅 {selectedDate.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })}
              </Text>
              <Ionicons name="close-circle" size={16} color="#FFFFFF" />
            </TouchableOpacity>
          )}

          <TouchableOpacity 
            style={[s.filterChipCalendar, dateFilter === 'custom' && !selectedDate && s.filterChipActive]}
            onPress={() => setCalendarVisible(true)}
          >
            <Ionicons 
              name="calendar-outline" 
              size={16} 
              color={dateFilter === 'custom' ? '#FFFFFF' : '#4B5563'} 
            />
          </TouchableOpacity>
        </ScrollView>
      </View>

      {loading ? (
        <ActivityIndicator style={{ flex: 1 }} size="large"
          color={tab === 'objects' ? '#D97706' : '#7C3AED'} />
      ) : (
        <View style={{ flex: 1 }}>
          <FlatList
            data={paginatedItems}
            keyExtractor={i => i.id}
            contentContainerStyle={{ padding: 16, gap: 12 }}
            onRefresh={() => load(tab)} refreshing={loading}
            renderItem={({ item }) => (
              <TouchableOpacity style={s.card} onPress={() => openDetail(item)}>
                <Image
                  source={{ uri: item.annotated_url || item.image_url }}
                  style={s.thumb}
                />
                <View style={s.info}>
                  <Text style={s.objCount}>
                    {tab === 'objects'
                      ? `${item.total_objects} objetos detectados`
                      : `${item.faces_found} rostros identificados`}
                  </Text>
                  <View style={s.metaRow}>
                    <Text style={[s.time, tab === 'objects' ? { color: '#B45309' } : { color: '#6D28D9' }]}>
                      <Ionicons name="speedometer-outline" size={12} /> {Math.round(item.processing_time_ms)}ms
                    </Text>
                    <Text style={s.date}>
                      <Ionicons name="time-outline" size={12} />{' '}
                      {new Date(item.created_at).toLocaleDateString('es-CO', {
                        day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
                      })}
                    </Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#9CA3AF" style={{ marginRight: 10 }} />
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <View style={s.empty}>
                <View style={s.emptyCircle}>
                  <Ionicons name="calendar-outline" size={40} color="#9CA3AF" />
                </View>
                <Text style={s.emptyTxt}>Sin capturas registradas en este período</Text>
              </View>
            }
          />

          {/* Barra de Paginación */}
          {filteredItems.length > 10 && (
            <View style={s.paginationBar}>
              <TouchableOpacity 
                style={[s.pageBtn, page === 1 && s.pageBtnDisabled]}
                onPress={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <Ionicons name="chevron-back" size={16} color={page === 1 ? "#9CA3AF" : "#1F2937"} />
                <Text style={[s.pageBtnTxt, page === 1 && s.pageBtnTxtDisabled]}>Anterior</Text>
              </TouchableOpacity>
              
              <Text style={s.pageIndicator}>
                Pág. {page} de {totalPages}
              </Text>
              
              <TouchableOpacity 
                style={[s.pageBtn, page === totalPages && s.pageBtnDisabled]}
                onPress={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                <Text style={[s.pageBtnTxt, page === totalPages && s.pageBtnTxtDisabled]}>Siguiente</Text>
                <Ionicons name="chevron-forward" size={16} color={page === totalPages ? "#9CA3AF" : "#1F2937"} />
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

      {/* --- MODAL DE CALENDARIO CUSTOM --- */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={calendarVisible}
        onRequestClose={() => setCalendarVisible(false)}
      >
        <View style={s.modalOverlay}>
          <View style={s.calendarCard}>
            {/* Header Calendario */}
            <View style={s.calendarHeader}>
              <TouchableOpacity onPress={handlePrevMonth} style={s.monthArrow}>
                <Ionicons name="chevron-back" size={20} color="#4B5563" />
              </TouchableOpacity>
              <Text style={s.calendarMonthTxt}>
                {monthNames[currentCalendarMonth.getMonth()]} {currentCalendarMonth.getFullYear()}
              </Text>
              <TouchableOpacity onPress={handleNextMonth} style={s.monthArrow}>
                <Ionicons name="chevron-forward" size={20} color="#4B5563" />
              </TouchableOpacity>
            </View>

            {/* Cabecera Días de Semana */}
            <View style={s.weekDaysRow}>
              {weekDays.map((wd, i) => (
                <Text key={i} style={s.weekDayLabel}>{wd}</Text>
              ))}
            </View>

            {/* Cuadrícula de Días */}
            <View style={s.daysGrid}>
              {calendarDays.map((dayDate, index) => {
                if (!dayDate) {
                  return <View key={index} style={s.calendarDayItemEmpty} />;
                }
                const isSelected = selectedDate && dayDate.toDateString() === selectedDate.toDateString();
                const isToday = dayDate.toDateString() === new Date().toDateString();
                return (
                  <TouchableOpacity
                    key={index}
                    style={[
                      s.calendarDayItem,
                      isSelected && [s.calendarDaySelected, { backgroundColor: tab === 'objects' ? '#D97706' : '#7C3AED' }],
                      isToday && !isSelected && s.calendarDayToday
                    ]}
                    onPress={() => selectCalendarDate(dayDate)}
                  >
                    <Text style={[
                      s.calendarDayTxt,
                      isSelected && s.calendarDayTxtSelected,
                      isToday && !isSelected && { color: tab === 'objects' ? '#D97706' : '#7C3AED', fontWeight: '800' }
                    ]}>
                      {dayDate.getDate()}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Botones de acción del Calendario */}
            <View style={s.calendarActions}>
              <TouchableOpacity style={s.calendarCancelBtn} onPress={() => setCalendarVisible(false)}>
                <Text style={s.calendarCancelTxt}>Cancelar</Text>
              </TouchableOpacity>
              {selectedDate && (
                <TouchableOpacity style={s.calendarClearBtn} onPress={clearCalendarFilter}>
                  <Text style={s.calendarClearTxt}>Limpiar Filtro</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </Modal>

      {/* --- MODAL DE DETALLE AUMENTADO --- */}
      {selectedItem && (
        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={s.modalOverlay}>
            <View style={s.modalContainer}>
              {/* Header Modal */}
              <View style={s.modalHeader}>
                <Text style={s.modalHeaderTitle} numberOfLines={1}>Detalle de Análisis</Text>
                <TouchableOpacity style={s.closeModalBtn} onPress={() => setModalVisible(false)}>
                  <Ionicons name="close" size={24} color="#374151" />
                </TouchableOpacity>
              </View>

              <ScrollView contentContainerStyle={s.modalContent} showsVerticalScrollIndicator={false}>
                {/* Imagen Principal */}
                <View style={s.imageContainer}>
                  <Image
                    source={{ uri: showAnnotated ? (selectedItem.annotated_url || selectedItem.image_url) : selectedItem.image_url }}
                    style={s.modalImage}
                    resizeMode="contain"
                  />
                  
                  {/* Selector Original vs Anotada */}
                  <View style={s.imageToggles}>
                    <TouchableOpacity 
                      style={[s.toggleBtn, showAnnotated && s.toggleBtnActive]}
                      onPress={() => setShowAnnotated(true)}
                    >
                      <Text style={[s.toggleBtnTxt, showAnnotated && s.toggleBtnActiveTxt]}>Anotada</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[s.toggleBtn, !showAnnotated && s.toggleBtnActive]}
                      onPress={() => setShowAnnotated(false)}
                    >
                      <Text style={[s.toggleBtnTxt, !showAnnotated && s.toggleBtnActiveTxt]}>Original</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Métricas Generales */}
                <View style={s.detailsBlock}>
                  <Text style={s.sectionTitle}>Métricas del Sistema</Text>
                  
                  <View style={s.gridRow}>
                    <View style={s.gridCol}>
                      <Text style={s.gridLabel}>Resultados</Text>
                      <Text style={s.gridVal}>
                        {tab === 'objects'
                          ? `${selectedItem.total_objects} Obj.`
                          : `${selectedItem.faces_found} Rostros`}
                      </Text>
                    </View>
                    <View style={s.gridCol}>
                      <Text style={s.gridLabel}>Inferencia</Text>
                      <Text style={s.gridVal}>{Math.round(selectedItem.processing_time_ms)} ms</Text>
                    </View>
                    <View style={s.gridCol}>
                      <Text style={s.gridLabel}>Fecha de Registro</Text>
                      <Text style={s.gridValSmall}>
                        {new Date(selectedItem.created_at).toLocaleDateString('es-CO', {
                          day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
                        })}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Resultados Desglosados */}
                <View style={s.detailsBlock}>
                  <Text style={s.sectionTitle}>
                    {tab === 'objects' ? 'Objetos Localizados' : 'Personas Identificadas'}
                  </Text>

                  {loadingDetail ? (
                    <ActivityIndicator size="small" color="#D97706" style={{ marginVertical: 12 }} />
                  ) : tab === 'objects' ? (
                    // Mostrar objetos de YOLO
                    detailData?.detections && detailData.detections.length > 0 ? (
                      detailData.detections.map((det: any, index: number) => (
                        <View key={index} style={s.detailRow}>
                          <Ionicons name="cube-outline" size={16} color="#D97706" />
                          <Text style={s.detailLabel}>{det.label}</Text>
                          <View style={[s.valBadge, { backgroundColor: '#FEF3C7' }]}>
                            <Text style={[s.valBadgeTxt, { color: '#B45309' }]}>{(det.confidence * 100).toFixed(0)}% Conf.</Text>
                          </View>
                        </View>
                      ))
                    ) : (
                      <Text style={s.emptyDetailsTxt}>No se registraron clasificaciones de objetos.</Text>
                    )
                  ) : (
                    // Mostrar Rostros de DeepFace
                    selectedItem.matches && selectedItem.matches.length > 0 ? (
                      selectedItem.matches.map((match: any, index: number) => (
                        <View key={index} style={s.detailRow}>
                          <Ionicons name="person-outline" size={16} color="#7C3AED" />
                          <Text style={s.detailLabel}>{match.person_name}</Text>
                          <View style={[s.valBadge, { backgroundColor: '#F3E8FF' }]}>
                            <Text style={[s.valBadgeTxt, { color: '#6D28D9' }]}>Similitud: {(match.similarity * 100).toFixed(1)}%</Text>
                          </View>
                        </View>
                      ))
                    ) : (
                      <View style={s.detailRow}>
                        <Ionicons name="help-circle-outline" size={16} color="#EF4444" />
                        <Text style={s.detailLabel}>Persona Desconocida</Text>
                        <View style={[s.valBadge, { backgroundColor: '#FEF2F2' }]}>
                          <Text style={[s.valBadgeTxt, { color: '#EF4444' }]}>Sin coincidencias</Text>
                        </View>
                      </View>
                    )
                  )}
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
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
  
  tabs: { flexDirection: 'row', backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  tab: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 14, gap: 8,
  },
  tabActiveObjects: { borderBottomWidth: 3, borderBottomColor: '#D97706' },
  tabActiveFaces: { borderBottomWidth: 3, borderBottomColor: '#7C3AED' },
  tabTxt: { fontSize: 14, fontWeight: '600', color: '#6B7280' },
  
  filtersContainer: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 10, gap: 8, backgroundColor: '#FFFFFF' },
  filterChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#F3F4F6' },
  filterChipCalendar: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' },
  filterChipActive: { backgroundColor: '#111827' },
  filterChipTxt: { fontSize: 12, color: '#4B5563', fontWeight: '600' },
  filterChipActiveTxt: { color: '#FFFFFF', fontWeight: '700' },

  card: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: '#F3F4F6',
    shadowColor: '#000', shadowOpacity: 0.02, shadowRadius: 8, elevation: 2,
  },
  thumb: { width: 84, height: 84, backgroundColor: '#E5E7EB' },
  info: { flex: 1, padding: 14, gap: 4 },
  objCount: { fontSize: 15, fontWeight: '800', color: '#1F2937' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 2 },
  time: { fontSize: 12, fontWeight: '700' },
  date: { fontSize: 12, color: '#9CA3AF', fontWeight: '500' },
  
  empty: { alignItems: 'center', paddingTop: 80, gap: 14 },
  emptyCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' },
  emptyTxt: { fontSize: 14, color: '#9CA3AF', fontWeight: '500' },

  // Estilos del Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  modalContainer: { 
    backgroundColor: '#FFFFFF', borderTopLeftRadius: 28, borderTopRightRadius: 28,
    height: '90%', width: '100%', position: 'absolute', bottom: 0,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 10, elevation: 5
  },
  modalHeader: { 
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 18, borderBottomWidth: 1, borderBottomColor: '#F3F4F6'
  },
  modalHeaderTitle: { fontSize: 18, fontWeight: '800', color: '#1F2937', flex: 1 },
  closeModalBtn: { padding: 4, backgroundColor: '#F3F4F6', borderRadius: 20 },
  
  modalContent: { padding: 20, gap: 20 },
  imageContainer: { width: '100%', height: 320, backgroundColor: '#111827', borderRadius: 20, overflow: 'hidden', justifyContent: 'center' },
  modalImage: { width: '100%', height: '100%' },
  imageToggles: { 
    position: 'absolute', bottom: 12, alignSelf: 'center',
    flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.85)',
    padding: 4, borderRadius: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)'
  },
  toggleBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  toggleBtnActive: { backgroundColor: '#111827' },
  toggleBtnTxt: { fontSize: 12, color: '#374151', fontWeight: '700' },
  toggleBtnActiveTxt: { color: '#FFFFFF' },

  detailsBlock: { backgroundColor: '#F9FAFB', borderRadius: 20, padding: 16, borderWidth: 1, borderColor: '#F3F4F6' },
  sectionTitle: { fontSize: 14, fontWeight: '800', color: '#6B7280', textTransform: 'uppercase', marginBottom: 12, letterSpacing: 0.5 },
  
  gridRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  gridCol: { flex: 1, backgroundColor: '#FFFFFF', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#F3F4F6' },
  gridLabel: { fontSize: 11, color: '#9CA3AF', fontWeight: '600', marginBottom: 4 },
  gridVal: { fontSize: 14, fontWeight: '800', color: '#1F2937' },
  gridValSmall: { fontSize: 11, fontWeight: '700', color: '#1F2937', lineHeight: 15 },
  
  detailRow: { 
    flexDirection: 'row', alignItems: 'center', paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: '#F3F4F6', gap: 10
  },
  detailLabel: { fontSize: 15, fontWeight: '700', color: '#1F2937', flex: 1 },
  valBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  valBadgeTxt: { fontSize: 12, fontWeight: '700' },
  emptyDetailsTxt: { fontSize: 13, color: '#9CA3AF', textAlign: 'center', paddingVertical: 10 },

  // Estilos del Calendario Custom
  calendarCard: {
    backgroundColor: '#FFFFFF', borderRadius: 24, padding: 20,
    width: '90%', maxWidth: 340, alignItems: 'center', gap: 16,
    shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 16, elevation: 6,
    borderWidth: 1, borderColor: '#F3F4F6'
  },
  calendarHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    width: '100%', paddingHorizontal: 4
  },
  monthArrow: { padding: 6, backgroundColor: '#F3F4F6', borderRadius: 12 },
  calendarMonthTxt: { fontSize: 16, fontWeight: '800', color: '#1F2937' },
  
  weekDaysRow: {
    flexDirection: 'row', justifyContent: 'space-between', width: '100%',
    paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: '#F3F4F6'
  },
  weekDayLabel: { width: 36, textAlign: 'center', fontSize: 12, fontWeight: '700', color: '#9CA3AF' },
  
  daysGrid: {
    flexDirection: 'row', flexWrap: 'wrap', width: '100%', gap: 4, justifyContent: 'space-between'
  },
  calendarDayItem: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center'
  },
  calendarDayItemEmpty: { width: 36, height: 36 },
  calendarDaySelected: { borderRadius: 18 },
  calendarDayToday: { borderWidth: 1.5, borderColor: '#E5E7EB' },
  calendarDayTxt: { fontSize: 13, fontWeight: '600', color: '#4B5563' },
  calendarDayTxtSelected: { color: '#FFFFFF', fontWeight: '800' },
  
  calendarActions: {
    flexDirection: 'row', width: '100%', gap: 12, marginTop: 10,
    borderTopWidth: 1, borderTopColor: '#F3F4F6', paddingTop: 14
  },
  calendarCancelBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center', backgroundColor: '#F3F4F6' },
  calendarCancelTxt: { fontSize: 14, fontWeight: '700', color: '#4B5563' },
  calendarClearBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center', backgroundColor: '#FEF2F2' },
  calendarClearTxt: { fontSize: 14, fontWeight: '700', color: '#EF4444' },

  paginationBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 14, backgroundColor: '#FFFFFF',
    borderTopWidth: 1, borderTopColor: '#F3F4F6',
  },
  pageBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12,
    backgroundColor: '#F3F4F6',
  },
  pageBtnDisabled: { backgroundColor: '#F9FAFB' },
  pageBtnTxt: { fontSize: 13, fontWeight: '700', color: '#1F2937' },
  pageBtnTxtDisabled: { color: '#9CA3AF' },
  pageIndicator: { fontSize: 14, fontWeight: '800', color: '#4B5563' },
});
