import React, { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, SafeAreaView, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView
} from "react-native";
import { useRouter } from "expo-router";
import { useAuthStore } from "../src/store/authStore";
import { Ionicons } from "@expo/vector-icons";
import { CustomAlert } from "../src/components/CustomAlert";

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    type: 'error' as 'error' | 'warning' | 'success',
    title: '',
    message: '',
  });

  const handleLogin = async () => {
    if (!email || !password) {
      setAlertConfig({
        visible: true,
        type: 'warning',
        title: 'Campos incompletos',
        message: 'Por favor, ingresa tu correo y contraseña.',
      });
      return;
    }
    setLoading(true);
    try {
      await login(email.trim(), password);
      router.replace("/(tabs)/home");
    } catch (e: any) {
      setAlertConfig({
        visible: true,
        type: 'error',
        title: 'Error de ingreso',
        message: e?.message || 'Credenciales inválidas. Verifica tu correo y contraseña.',
      });
    } finally { setLoading(false); }
  };

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={s.kav}>
        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
          <View style={s.header}>
            <View style={s.iconWrapper}>
              <Ionicons name="scan" size={28} color="#7C3AED" />
            </View>
            <Text style={s.appName}>
              Detector de <Text style={{ color: '#D97706' }}>objetos</Text>{'\n'}
              y <Text style={{ color: '#7C3AED' }}>personas</Text>
            </Text>
            <View style={s.taglineBadge}>
              <Text style={s.taglineText}>YOLOv8 • DEEPFACE • SUPABASE</Text>
            </View>
          </View>
          <View style={s.form}>
            <Text style={s.label}>Correo electronico</Text>
            <TextInput style={s.input} value={email} onChangeText={setEmail}
              placeholder="tu@correo.com" autoCapitalize="none"
              keyboardType="email-address" placeholderTextColor="#9CA3AF" />
            <Text style={s.label}>Contrasena</Text>
            <TextInput style={s.input} value={password} onChangeText={setPassword}
              placeholder="••••••••" secureTextEntry placeholderTextColor="#9CA3AF" />
            <TouchableOpacity style={s.btn} onPress={handleLogin} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.btnTxt}>Iniciar sesion</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={s.link} onPress={() => router.push("/register")}>
              <Text style={s.linkTxt}>No tienes cuenta? <Text style={{ color: "#2563EB" }}>Registrate</Text></Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <CustomAlert
        visible={alertConfig.visible}
        type={alertConfig.type}
        title={alertConfig.title}
        message={alertConfig.message}
        onClose={() => setAlertConfig(prev => ({ ...prev, visible: false }))}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F9FAFB" },
  kav: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: "center", padding: 24 },
  header: { alignItems: "center", marginBottom: 36, width: "100%", maxWidth: 460, alignSelf: "center" },
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
  label: { fontSize: 13, fontWeight: "600", color: "#374151", marginBottom: 6, marginTop: 12 },
  input: { borderWidth: 1, borderColor: "#D1D5DB", borderRadius: 10,
    padding: 13, fontSize: 15, color: "#111827" },
  btn: { backgroundColor: "#1A1A2E", borderRadius: 10,
    padding: 15, alignItems: "center", marginTop: 24 },
  btnTxt: { color: "#fff", fontWeight: "700", fontSize: 16 },
  link: { alignItems: "center", marginTop: 16 },
  linkTxt: { fontSize: 14, color: "#6B7280" },
});
