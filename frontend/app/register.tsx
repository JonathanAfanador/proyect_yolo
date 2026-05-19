import React, { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, SafeAreaView, Alert, ActivityIndicator, ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuthStore } from "../src/store/authStore";

export default function RegisterScreen() {
  const router = useRouter();
  const { register } = useAuthStore();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!fullName || !email || !password) {
      Alert.alert("Error", "Completa todos los campos"); return;
    }
    if (password.length < 8) {
      Alert.alert("Error", "La contrasena debe tener al menos 8 caracteres"); return;
    }
    setLoading(true);
    try {
      await register(email.trim(), password, fullName.trim());
      Alert.alert("Exito", "Cuenta creada. Revisa tu correo para confirmar.",
        [{ text: "OK", onPress: () => router.replace("/login") }]);
    } catch (e: any) {
      Alert.alert("Error", e?.message || "No se pudo crear la cuenta");
    } finally { setLoading(false); }
  };

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.scroll}>
        <View style={s.header}>
          <Text style={s.appName}>CNN Unified</Text>
          <Text style={s.tagline}>Crear cuenta nueva</Text>
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
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F9FAFB" },
  scroll: { flexGrow: 1, justifyContent: "center", padding: 24 },
  header: { alignItems: "center", marginBottom: 32 },
  appName: { fontSize: 28, fontWeight: "800", color: "#1A1A2E" },
  tagline: { fontSize: 13, color: "#6B7280", marginTop: 4 },
  form: { backgroundColor: "#fff", borderRadius: 16, padding: 24,
    shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 12, elevation: 4 },
  label: { fontSize: 13, fontWeight: "600", color: "#374151", marginBottom: 6, marginTop: 14 },
  input: { borderWidth: 1, borderColor: "#D1D5DB", borderRadius: 10,
    padding: 13, fontSize: 15, color: "#111827" },
  btn: { backgroundColor: "#1A1A2E", borderRadius: 10, padding: 15, alignItems: "center", marginTop: 24 },
  btnTxt: { color: "#fff", fontWeight: "700", fontSize: 16 },
  link: { alignItems: "center", marginTop: 16 },
  linkTxt: { fontSize: 14, color: "#6B7280" },
});
