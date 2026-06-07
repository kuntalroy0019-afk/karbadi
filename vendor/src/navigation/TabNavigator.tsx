import { Ionicons } from "@expo/vector-icons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import React from "react";
import { StyleSheet } from "react-native";

import DashboardScreen from "../screens/DashboardScreen";
import InquiriesScreen from "../screens/InquiriesScreen";
import ListingsScreen from "../screens/ListingsScreen";
import SalesScreen from "../screens/SalesScreen";
import StorefrontScreen from "../screens/StorefrontScreen";
import { colors, shadow } from "../theme";
import { TabParamList } from "./types";

const Tab = createBottomTabNavigator<TabParamList>();

const ICONS: Record<string, [keyof typeof Ionicons.glyphMap, keyof typeof Ionicons.glyphMap]> = {
  Dashboard: ["grid", "grid-outline"],
  Listings: ["pricetags", "pricetags-outline"],
  Orders: ["receipt", "receipt-outline"],
  Inquiries: ["chatbubbles", "chatbubbles-outline"],
  Store: ["storefront", "storefront-outline"],
};

export default function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
        tabBarIcon: ({ color, size, focused }) => {
          const [on, off] = ICONS[route.name];
          return <Ionicons name={focused ? on : off} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Listings" component={ListingsScreen} />
      <Tab.Screen name="Orders" component={SalesScreen} options={{ title: "Sales" }} />
      <Tab.Screen name="Inquiries" component={InquiriesScreen} />
      <Tab.Screen name="Store" component={StorefrontScreen} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: { height: 64, paddingBottom: 8, paddingTop: 8, backgroundColor: colors.surface, borderTopWidth: 0, ...shadow.card },
});
