import React, { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, SafeAreaView, Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuthStore } from "../src/store/authStore";

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Ingresa tu correo y contrasena"); return;
    }
    setLoading(true);
    try {
      await login(email.trim(), password);
      router.replace("/(tabs)/home");
    } catch (e: any) {
      Alert.alert("Error", e?.message || "Credenciales invalidas");
    } finally { setLoading(false); }
  };

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={s.kav}>
        <View style={s.header}>
          <Text style={s.appName}>CNN Unified</Text>
          <Text style={s.tagline}>YOLO + DeepFace + Supabase</Text>
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
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F9FAFB" },
  kav: { flex: 1, justifyContent: "center", padding: 24 },
  header: { alignItems: "center", marginBottom: 40 },
  appName: { fontSize: 32, fontWeight: "800", color: "#1A1A2E" },
  tagline: { fontSize: 13, color: "#6B7280", marginTop: 4 },
  form: { backgroundColor: "#fff", borderRadius: 16, padding: 24,
    shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 12, elevation: 4 },
  label: { fontSize: 13, fontWeight: "600", color: "#374151", marginBottom: 6, marginTop: 12 },
  input: { borderWidth: 1, borderColor: "#D1D5DB", borderRadius: 10,
    padding: 13, fontSize: 15, color: "#111827" },
  btn: { backgroundColor: "#1A1A2E", borderRadius: 10,
    padding: 15, alignItems: "center", marginTop: 24 },
  btnTxt: { color: "#fff", fontWeight: "700", fontSize: 16 },
  link: { alignItems: "center", marginTop: 16 },
  linkTxt: { fontSize: 14, color: "#6B7280" },
});
