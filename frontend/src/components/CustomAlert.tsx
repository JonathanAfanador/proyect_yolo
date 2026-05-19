import React from 'react';
import {
  Modal, View, Text, TouchableOpacity, StyleSheet,
  Dimensions, Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface CustomAlertProps {
  visible: boolean;
  type: 'success' | 'error' | 'warning';
  title: string;
  message: string;
  onClose: () => void;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
}

export function CustomAlert({
  visible,
  type,
  title,
  message,
  onClose,
  confirmText = 'Aceptar',
  cancelText = 'Cancelar',
  onConfirm
}: CustomAlertProps) {
  
  // Configuración de colores y estilos según el tipo
  const getConfig = () => {
    switch (type) {
      case 'success':
        return {
          icon: 'checkmark-circle' as const,
          color: '#10B981',
          bg: '#ECFDF5',
          btnBg: '#10B981'
        };
      case 'error':
        return {
          icon: 'close-circle' as const,
          color: '#EF4444',
          bg: '#FEF2F2',
          btnBg: '#EF4444'
        };
      case 'warning':
      default:
        return {
          icon: 'warning' as const,
          color: '#F59E0B',
          bg: '#FFFBEB',
          btnBg: '#F59E0B'
        };
    }
  };

  const config = getConfig();

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={s.overlay}>
        <View style={s.card}>
          {/* Icono Principal */}
          <View style={[s.iconBg, { backgroundColor: config.bg }]}>
            <Ionicons name={config.icon} size={36} color={config.color} />
          </View>

          {/* Título */}
          <Text style={s.title}>{title}</Text>

          {/* Mensaje */}
          <Text style={s.message}>{message}</Text>

          {/* Botones */}
          <View style={s.actions}>
            {onConfirm && (
              <TouchableOpacity 
                style={[s.btn, s.btnCancel]} 
                onPress={onClose}
                activeOpacity={0.8}
              >
                <Text style={s.btnCancelTxt}>{cancelText}</Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity 
              style={[s.btn, { backgroundColor: config.btnBg }, onConfirm ? { flex: 1 } : { width: '100%' }]} 
              onPress={onConfirm || onClose}
              activeOpacity={0.8}
            >
              <Text style={s.btnTxt}>{confirmText}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const { width } = Dimensions.get('window');

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)', // azul oscuro semi-transparente para mayor contraste
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: width * 0.85,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  iconBg: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  message: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  actions: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  btn: {
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  btnTxt: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  btnCancel: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
  },
  btnCancelTxt: {
    fontSize: 15,
    fontWeight: '700',
    color: '#4B5563',
  },
});
