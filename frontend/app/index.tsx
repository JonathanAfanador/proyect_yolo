import { Redirect } from "expo-router";
import { useAuthStore } from "../src/store/authStore";
import { useEffect } from "react";
import { View, ActivityIndicator } from "react-native";

export default function Index() {
  const { user, loading, initialize } = useAuthStore();

  useEffect(() => { initialize(); }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  return <Redirect href={user ? "/(tabs)/home" : "/login"} />;
}
