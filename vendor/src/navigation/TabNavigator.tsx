import { Ionicons } from "@expo/vector-icons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import React from "react";
import { StyleSheet } from "react-native";

import { haptic } from "../components/motion";
import DashboardScreen from "../screens/DashboardScreen";
import InquiriesScreen from "../screens/InquiriesScreen";
import ListingsScreen from "../screens/ListingsScreen";
import MoreScreen from "../screens/MoreScreen";
import SalesScreen from "../screens/SalesScreen";
import { colors, font } from "../theme";
import { TabParamList } from "./types";

const Tab = createBottomTabNavigator<TabParamList>();

const ICONS: Record<string, [keyof typeof Ionicons.glyphMap, keyof typeof Ionicons.glyphMap]> = {
  Dashboard: ["grid", "grid-outline"],
  Inquiries: ["chatbubbles", "chatbubbles-outline"],
  Orders: ["receipt", "receipt-outline"],
  Listings: ["pricetags", "pricetags-outline"],
  More: ["ellipsis-horizontal-circle", "ellipsis-horizontal-circle-outline"],
};

export default function TabNavigator() {
  return (
    <Tab.Navigator
      screenListeners={{ tabPress: () => haptic.select() }}
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textFaint,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: { fontSize: font.tiny, fontWeight: "600", marginTop: 2 },
        tabBarItemStyle: { paddingTop: 8 },
        tabBarIcon: ({ color, focused }) => {
          const [on, off] = ICONS[route.name];
          return <Ionicons name={focused ? on : off} size={23} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Inquiries" component={InquiriesScreen} />
      <Tab.Screen name="Orders" component={SalesScreen} />
      <Tab.Screen name="Listings" component={ListingsScreen} />
      <Tab.Screen name="More" component={MoreScreen} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    height: 66, paddingBottom: 8, paddingTop: 4, backgroundColor: colors.surface,
    borderTopWidth: 1, borderTopColor: colors.border, elevation: 0,
  },
});
