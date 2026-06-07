import { Ionicons } from "@expo/vector-icons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import React from "react";
import { StyleSheet } from "react-native";

import AccountScreen from "../screens/AccountScreen";
import DiscoverScreen from "../screens/DiscoverScreen";
import HomeScreen from "../screens/HomeScreen";
import MessagesScreen from "../screens/MessagesScreen";
import SellScreen from "../screens/SellScreen";
import { colors, font } from "../theme";
import { TabParamList } from "./types";

const Tab = createBottomTabNavigator<TabParamList>();

const ICONS: Record<string, [keyof typeof Ionicons.glyphMap, keyof typeof Ionicons.glyphMap]> = {
  Home: ["home", "home-outline"],
  Discover: ["compass", "compass-outline"],
  Messages: ["chatbubbles", "chatbubbles-outline"],
  Sell: ["pricetag", "pricetag-outline"],
  Account: ["person", "person-outline"],
};

export default function TabNavigator() {
  return (
    <Tab.Navigator
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
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Discover" component={DiscoverScreen} />
      <Tab.Screen name="Messages" component={MessagesScreen} />
      <Tab.Screen name="Sell" component={SellScreen} />
      <Tab.Screen name="Account" component={AccountScreen} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    height: 66,
    paddingBottom: 8,
    paddingTop: 4,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    elevation: 0,
  },
});
