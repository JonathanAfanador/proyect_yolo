import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Image, Alert, ActivityIndicator, Keyboard, Platform, BackHandler, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImageManipulator from 'expo-image-manipulator';
import { useFaceRecognition } from '../hooks/useFaceRecognition';

export default function RegisterFaceScreen() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [step, setStep] = useState(1); // 1: Ingresar Nombre, 2: Capturar Rostro, 3: Éxito
  const [capturedUri, setCapturedUri] = useState<string | null>(null);
  const [personName, setPersonName] = useState('');
  const cameraRef = useRef<any>(null);
  const { registerFace, loading, error } = useFaceRecognition();

  // Estados de Alerta Bonita
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState<'error' | 'warning'>('error');

  const showAlert = (title: string, message: string, type: 'error' | 'warning' = 'error') => {
    setAlertTitle(title);
    setAlertMessage(message);
    setAlertType(type);
    setAlertVisible(true);
  };

  // Controlar el botón de retroceso físico de Android
  useEffect(() => {
    const onBackPress = () => {
      if (step === 2) {
        setStep(1);
        setCapturedUri(null);
        return true; // Previene que salga de la pantalla
      }
      return false; // Permite retroceder normalmente
    };

    BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => BackHandler.removeEventListener('hardwareBackPress', onBackPress);
  }, [step]);

  // Comprimir y redimensionar la imagen antes de subirla
  const compressImage = async (uri: string): Promise<string> => {
    try {
      const result = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 800 } }], // Redimensionar ancho a 800px (mantiene aspecto)
        { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG } // Comprimir calidad al 70%
      );
      return result.uri;
    } catch (e) {
      console.warn("Error al comprimir imagen, usando original:", e);
      return uri;
    }
  };

  const handleNextStep = () => {
    if (!personName.trim()) {
      showAlert('Nombre Requerido', 'Por favor ingresa el nombre de la persona para poder continuar.', 'error');
      return;
    }
    Keyboard.dismiss();
    setStep(2); // Pasar al paso de la cámara
  };

  const takePicture = async () => {
    if (!cameraRef.current) return;
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.5 });
      if (photo) {
        const compressedUri = await compressImage(photo.uri);
        setCapturedUri(compressedUri);
      }
    } catch (e) {
      showAlert('Error de Cámara', 'No se pudo tomar la foto. Intenta de nuevo.', 'error');
    }
  };

  const handleRegister = async () => {
    if (!capturedUri || !personName.trim()) return;
    try {
      await registerFace(capturedUri, personName.trim());
      setStep(3); // Éxito
    } catch (e: any) {
      const errMsg = error || e?.response?.data?.detail || 'No se pudo registrar el rostro.';
      if (errMsg.includes('ya está registrado')) {
        showAlert('Rostro Duplicado', errMsg, 'warning');
      } else {
        showAlert('Fallo de Registro', errMsg, 'error');
      }
    }
  };

  // --- PASO 3: ÉXITO ---
  if (step === 3) {
    return (
      <SafeAreaView style={s.center}>
        <View style={s.successCard}>
          <View style={s.successCircle}>
            <Ionicons name="checkmark" size={50} color="#fff" />
          </View>
          <Text style={s.successTitle}>¡Registro Exitoso!</Text>
          <Text style={s.successSub}>
            El rostro de <Text style={{fontWeight: '800', color: '#111827'}}>{personName}</Text> ha sido guardado de forma segura en la base de datos.
          </Text>
          
          <TouchableOpacity style={s.primaryBtn} onPress={() => router.back()}>
            <Text style={s.primaryTxt}>Volver al inicio</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={s.secondaryBtn}
            onPress={() => {
              setStep(1);
              setCapturedUri(null);
              setPersonName('');
            }}
          >
            <Text style={s.secondaryTxt}>Registrar a alguien más</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // --- PASO 1: INGRESAR NOMBRE ---
  if (step === 1) {
    return (
      <SafeAreaView style={s.container} edges={['top']}>
        {/* TopBar */}
        <View style={s.topBar}>
          <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={28} color="#111827" />
          </TouchableOpacity>
          <Text style={s.topTitle}>Registrar Persona</Text>
          <View style={{ width: 32 }} />
        </View>

        {/* Formulario */}
        <View style={s.step1Content}>
          <View style={s.infoBox}>
            <Ionicons name="information-circle-outline" size={24} color="#7C3AED" />
            <Text style={s.infoText}>
              Ingresa el nombre de la persona para asociarla a su firma facial biométrica en la base de datos de Supabase.
            </Text>
          </View>

          <Text style={s.label}>Nombre completo</Text>
          <TextInput
            style={s.input}
            value={personName}
            onChangeText={setPersonName}
            placeholder="Ej: Juan Pérez"
            placeholderTextColor="#9CA3AF"
            autoFocus
          />

          <TouchableOpacity style={s.actionBtn} onPress={handleNextStep}>
            <Text style={s.primaryTxt}>Continuar a la cámara</Text>
            <Ionicons name="arrow-forward" size={18} color="#fff" style={{ marginLeft: 8 }} />
          </TouchableOpacity>
        </View>

        {/* Modal de Alerta Custom */}
        <Modal animationType="fade" transparent={true} visible={alertVisible}>
          <View style={s.modalOverlay}>
            <View style={s.modalCard}>
              <View style={[s.iconContainer, { backgroundColor: alertType === 'warning' ? '#FFFBEB' : '#FEF2F2' }]}>
                <Ionicons 
                  name={alertType === 'warning' ? 'shield-half' : 'alert-circle'} 
                  size={40} 
                  color={alertType === 'warning' ? '#D97706' : '#EF4444'} 
                />
              </View>
              <Text style={s.modalTitle}>{alertTitle}</Text>
              <Text style={s.modalText}>{alertMessage}</Text>
              <TouchableOpacity 
                style={[s.modalBtn, { backgroundColor: alertType === 'warning' ? '#D97706' : '#EF4444' }]} 
                onPress={() => setAlertVisible(false)}
              >
                <Text style={s.modalBtnText}>Entendido</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    );
  }

  // --- PASO 2: CÁMARA & CAPTURA ---
  if (!permission?.granted) {
    return (
      <SafeAreaView style={s.center}>
        <Ionicons name="camera-reverse-outline" size={56} color="#9CA3AF" />
        <Text style={s.permText}>Se necesita acceso a la cámara para el registro biométrico.</Text>
        <TouchableOpacity style={s.actionBtn} onPress={requestPermission}>
          <Text style={s.primaryTxt}>Permitir cámara</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      {/* TopBar */}
      <View style={s.topBar}>
        <TouchableOpacity style={s.backBtn} onPress={() => { setStep(1); setCapturedUri(null); }}>
          <Ionicons name="chevron-back" size={28} color="#111827" />
        </TouchableOpacity>
        <Text style={s.topTitle}>Capturar Rostro</Text>
        <View style={s.nameBadge}>
          <Text style={s.nameBadgeTxt} numberOfLines={1}>{personName}</Text>
        </View>
      </View>

      {capturedUri ? (
        // Vista Previa de Foto Capturada
        <View style={{ flex: 1, backgroundColor: '#000' }}>
          <Image source={{ uri: capturedUri }} style={{ flex: 1 }} resizeMode="contain" />
          <TouchableOpacity style={s.retakeBtn} onPress={() => setCapturedUri(null)}>
            <Ionicons name="refresh" size={16} color="#374151" />
            <Text style={s.retakeTxt}>Retomar foto</Text>
          </TouchableOpacity>
        </View>
      ) : (
        // Visor de Cámara Activo
        <CameraView ref={cameraRef} style={{ flex: 1 }} facing="front">
          <View style={s.frameWrap}>
            <View style={s.guideOval} />
            <Text style={s.guideHint}>Centra tu rostro dentro del óvalo</Text>
          </View>
        </CameraView>
      )}

      {/* Barra de acciones inferior */}
      <View style={s.bottomBar}>
        {!capturedUri ? (
          <TouchableOpacity style={s.captureBtn} onPress={takePicture}>
            <View style={[s.captureInner, { backgroundColor: '#7C3AED' }]} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[s.actionBtn, { flex: 1 }]}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="cloud-upload-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
                <Text style={s.primaryTxt}>Registrar rostro</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* Modal de Alerta Custom en Paso 2 */}
      <Modal animationType="fade" transparent={true} visible={alertVisible}>
        <View style={s.modalOverlay}>
          <View style={s.modalCard}>
            <View style={[s.iconContainer, { backgroundColor: alertType === 'warning' ? '#FFFBEB' : '#FEF2F2' }]}>
              <Ionicons 
                name={alertType === 'warning' ? 'shield-half' : 'alert-circle'} 
                size={40} 
                color={alertType === 'warning' ? '#D97706' : '#EF4444'} 
              />
            </View>
            <Text style={s.modalTitle}>{alertTitle}</Text>
            <Text style={s.modalText}>{alertMessage}</Text>
            <TouchableOpacity 
              style={[s.modalBtn, { backgroundColor: alertType === 'warning' ? '#D97706' : '#EF4444' }]} 
              onPress={() => setAlertVisible(false)}
            >
              <Text style={s.modalBtnText}>Entendido</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: '#F9FAFB' },
  topBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#fff', 
    paddingTop: Platform.OS === 'android' ? 10 : 14,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 3, zIndex: 10
  },
  backBtn: { padding: 4, marginLeft: -4 },
  topTitle: { fontSize: 18, fontWeight: '800', color: '#111827', flex: 1, textAlign: 'center' },
  nameBadge: { backgroundColor: '#F3E8FF', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, maxWidth: 100 },
  nameBadgeTxt: { fontSize: 12, color: '#7C3AED', fontWeight: '700' },
  step1Content: { padding: 24, gap: 16, flex: 1, justifyContent: 'center' },
  infoBox: { 
    flexDirection: 'row', gap: 12, backgroundColor: '#F5F3FF', 
    padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#DDD6FE',
    marginBottom: 10,
  },
  infoText: { flex: 1, fontSize: 13, color: '#6D28D9', lineHeight: 18, fontWeight: '500' },
  label: { fontSize: 14, fontWeight: '700', color: '#374151', marginBottom: 2 },
  input: {
    borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 16,
    padding: 16, fontSize: 16, color: '#111827', backgroundColor: '#fff',
    shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 6, elevation: 1,
    marginBottom: 12,
  },
  frameWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14 },
  guideOval: { width: 220, height: 290, borderRadius: 110, borderWidth: 2.5, borderColor: '#7C3AED', borderStyle: 'dashed' },
  guideHint: { color: '#fff', fontSize: 12, fontWeight: '600', textShadowColor: '#000', textShadowRadius: 3 },
  bottomBar: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    padding: 24, backgroundColor: '#fff', gap: 16,
    borderTopWidth: 1, borderTopColor: '#E5E7EB',
  },
  captureBtn: {
    width: 76, height: 76, borderRadius: 38,
    borderWidth: 3, borderColor: '#7C3AED', alignItems: 'center', justifyContent: 'center',
  },
  captureInner: { width: 58, height: 58, borderRadius: 29 },
  actionBtn: {
    backgroundColor: '#7C3AED', paddingHorizontal: 28, paddingVertical: 16,
    borderRadius: 16, alignItems: 'center', justifyContent: 'center', flexDirection: 'row',
    shadowColor: '#7C3AED', shadowOpacity: 0.2, shadowRadius: 6, elevation: 3,
  },
  primaryBtn: {
    backgroundColor: '#7C3AED', paddingHorizontal: 28, paddingVertical: 16,
    borderRadius: 16, alignItems: 'center', justifyContent: 'center', width: '100%',
    shadowColor: '#7C3AED', shadowOpacity: 0.2, shadowRadius: 6, elevation: 3,
  },
  primaryTxt: { color: '#fff', fontWeight: '700', fontSize: 15 },
  secondaryBtn: { borderWidth: 1.5, borderColor: '#E5E7EB', paddingHorizontal: 24, paddingVertical: 14, borderRadius: 16, width: '100%', alignItems: 'center', marginTop: 10 },
  secondaryTxt: { color: '#4B5563', fontWeight: '700', fontSize: 15 },
  retakeBtn: {
    position: 'absolute', bottom: 16, alignSelf: 'center',
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: 20, borderWidth: 1, borderColor: '#D1D5DB',
  },
  retakeTxt: { fontSize: 13, color: '#374151', fontWeight: '600' },
  successCard: {
    backgroundColor: '#fff', padding: 32, borderRadius: 24, width: '100%',
    alignItems: 'center', gap: 16, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 10, elevation: 4,
    borderWidth: 1, borderColor: '#F3F4F6',
  },
  successCircle: { width: 90, height: 90, borderRadius: 45, backgroundColor: '#10B981', alignItems: 'center', justifyContent: 'center' },
  successTitle: { fontSize: 24, fontWeight: '800', color: '#10B981', marginTop: 8 },
  successSub: { fontSize: 14, color: '#6B7280', textAlign: 'center', lineHeight: 22, marginBottom: 12 },
  permText: { fontSize: 15, color: '#6B7280', textAlign: 'center', marginBottom: 16 },
  
  // Estilos del Modal de Alerta Custom
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center', alignItems: 'center', padding: 24
  },
  modalCard: {
    backgroundColor: '#FFFFFF', borderRadius: 24, padding: 24,
    width: '100%', maxWidth: 320, alignItems: 'center', gap: 14,
    shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 12, elevation: 6,
    borderWidth: 1, borderColor: '#F3F4F6'
  },
  iconContainer: {
    width: 80, height: 80, borderRadius: 40,
    alignItems: 'center', justifyContent: 'center'
  },
  modalTitle: { fontSize: 20, fontWeight: '800', color: '#1F2937', textAlign: 'center' },
  modalText: { fontSize: 14, color: '#4B5563', textAlign: 'center', lineHeight: 22 },
  modalBtn: {
    width: '100%', paddingVertical: 14, borderRadius: 16,
    alignItems: 'center', marginTop: 10,
    shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 4, elevation: 2
  },
  modalBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
});
