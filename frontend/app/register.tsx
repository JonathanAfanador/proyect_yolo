import React, { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, SafeAreaView, ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform
} from "react-native";
import { useRouter } from "expo-router";
import { useAuthStore } from "../src/store/authStore";
import { Ionicons } from "@expo/vector-icons";
import { CustomAlert } from "../src/components/CustomAlert";

export default function RegisterScreen() {
  const router = useRouter();
  const { register } = useAuthStore();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    type: 'error' as 'error' | 'warning' | 'success',
    title: '',
    message: '',
    onClose: undefined as (() => void) | undefined,
  });

  const handleRegister = async () => {
    if (!fullName || !email || !password) {
      setAlertConfig({
        visible: true,
        type: 'warning',
        title: 'Campos incompletos',
        message: 'Por favor, completa todos los campos del formulario.',
        onClose: undefined,
      });
      return;
    }
    if (password.length < 8) {
      setAlertConfig({
        visible: true,
        type: 'warning',
        title: 'Contraseña muy corta',
        message: 'La contraseña debe tener al menos 8 caracteres para ser segura.',
        onClose: undefined,
      });
      return;
    }
    setLoading(true);
    try {
      await register(email.trim(), password, fullName.trim());
      setAlertConfig({
        visible: true,
        type: 'success',
        title: '¡Cuenta creada!',
        message: 'Revisa tu correo electrónico para confirmar tu cuenta y poder ingresar.',
        onClose: () => router.replace("/login"),
      });
    } catch (e: any) {
      setAlertConfig({
        visible: true,
        type: 'error',
        title: 'Error de registro',
        message: e?.message || 'No se pudo crear la cuenta. Verifica los datos.',
        onClose: undefined,
      });
    } finally { setLoading(false); }
  };

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={s.kav}>
        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
          <View style={s.header}>
            <View style={s.iconWrapper}>
              <Ionicons name="person-add" size={26} color="#7C3AED" />
            </View>
            <Text style={s.appName}>
              Detector de <Text style={{ color: '#D97706' }}>objetos</Text>{'\n'}
              y <Text style={{ color: '#7C3AED' }}>personas</Text>
            </Text>
            <View style={s.taglineBadge}>
              <Text style={s.taglineText}>CREAR CUENTA NUEVA</Text>
            </View>
          </View>
          <View style={s.form}>
            {[
              { label: "Nombre completo", value: fullName, setter: setFullName, placeholder: "Juan Perez", secure: false, keyboard: "default" },
              { label: "Correo electronico", value: email, setter: setEmail, placeholder: "tu@correo.com", secure: false, keyboard: "email-address" },
              { label: "Contrasena (min 8 caracteres)", value: password, setter: setPassword, placeholder: "••••••••", secure: true, keyboard: "default" },
            ].map(({ label, value, setter, placeholder, secure, keyboard }) => (
              <View key={label}>
                <Text style={s.label}>{label}</Text>
                <TextInput style={s.input} value={value} onChangeText={setter}
                  placeholder={placeholder} secureTextEntry={secure}
                  keyboardType={keyboard as any} autoCapitalize={secure || keyboard === "email-address" ? "none" : "words"}
                  placeholderTextColor="#9CA3AF" />
              </View>
            ))}
            <TouchableOpacity style={s.btn} onPress={handleRegister} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.btnTxt}>Crear cuenta</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={s.link} onPress={() => router.back()}>
              <Text style={s.linkTxt}>Ya tienes cuenta? <Text style={{ color: "#2563EB" }}>Inicia sesion</Text></Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <CustomAlert
        visible={alertConfig.visible}
        type={alertConfig.type}
        title={alertConfig.title}
        message={alertConfig.message}
        onClose={() => {
          setAlertConfig(prev => ({ ...prev, visible: false }));
          if (alertConfig.onClose) alertConfig.onClose();
        }}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F9FAFB" },
  kav: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: "center", padding: 24 },
  header: { alignItems: "center", marginBottom: 28, width: "100%", maxWidth: 460, alignSelf: "center" },
  iconWrapper: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F5F3FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    borderWidth: 1.5,
    borderColor: '#E9D5FF',
    shadowColor: '#7C3AED',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  appName: { fontSize: 26, fontWeight: "900", color: "#111827", textAlign: "center", lineHeight: 34 },
  taglineBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    marginTop: 10,
  },
  taglineText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#4B5563',
    letterSpacing: 1.2,
  },
  form: { backgroundColor: "#fff", borderRadius: 16, padding: 24,
    shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 12, elevation: 4,
    width: "100%", maxWidth: 460, alignSelf: "center" },
  label: { fontSize: 13, fontWeight: "600", color: "#374151", marginBottom: 6, marginTop: 14 },
  input: { borderWidth: 1, borderColor: "#D1D5DB", borderRadius: 10,
    padding: 13, fontSize: 15, color: "#111827" },
  btn: { backgroundColor: "#1A1A2E", borderRadius: 10, padding: 15, alignItems: "center", marginTop: 24 },
  btnTxt: { color: "#fff", fontWeight: "700", fontSize: 16 },
  link: { alignItems: "center", marginTop: 16 },
  linkTxt: { fontSize: 14, color: "#6B7280" },
});
