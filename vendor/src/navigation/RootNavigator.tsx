import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React from "react";

import { Loading } from "../components/ui";
import { useAuth } from "../context/AuthContext";
import LoginScreen from "../screens/LoginScreen";
import OrderDetailScreen from "../screens/OrderDetailScreen";
import PartFormScreen from "../screens/PartFormScreen";
import RegisterScreen from "../screens/RegisterScreen";
import StorefrontScreen from "../screens/StorefrontScreen";
import { colors } from "../theme";
import TabNavigator from "./TabNavigator";

const Stack = createNativeStackNavigator();

const headerOptions = {
  headerStyle: { backgroundColor: colors.bg },
  headerTintColor: colors.text,
  headerTitleStyle: { fontWeight: "700" as const, color: colors.text },
  headerShadowVisible: false,
  contentStyle: { backgroundColor: colors.bg },
};

export default function RootNavigator() {
  const { user, loading } = useAuth();
  if (loading) return <Loading label="Starting Karbadi Seller…" />;

  return (
    <Stack.Navigator screenOptions={headerOptions}>
      {!user ? (
        <>
          <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Register" component={RegisterScreen} options={{ title: "Become a Seller" }} />
        </>
      ) : (
        <>
          <Stack.Screen name="Tabs" component={TabNavigator} options={{ headerShown: false }} />
          <Stack.Screen name="PartForm" component={PartFormScreen}
            options={({ route }: any) => ({ title: route.params?.id ? "Edit Listing" : "New Listing" })} />
          <Stack.Screen name="OrderDetail" component={OrderDetailScreen} options={{ title: "Order" }} />
          <Stack.Screen name="Storefront" component={StorefrontScreen} options={{ title: "My Storefront" }} />
        </>
      )}
    </Stack.Navigator>
  );
}
