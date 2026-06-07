import { Ionicons } from "@expo/vector-icons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import React from "react";
import { StyleSheet, View } from "react-native";

import { useCart } from "../context/CartContext";
import CartScreen from "../screens/CartScreen";
import CategoriesScreen from "../screens/CategoriesScreen";
import HomeScreen from "../screens/HomeScreen";
import OrdersScreen from "../screens/OrdersScreen";
import SearchScreen from "../screens/SearchScreen";
import { colors, shadow } from "../theme";
import { TabParamList } from "./types";
import { Text } from "react-native";

const Tab = createBottomTabNavigator<TabParamList>();

export default function TabNavigator() {
  const { count } = useCart();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: { fontSize: 11, fontWeight: "600", marginTop: 2 },
        tabBarIcon: ({ color, size, focused }) => {
          // Center "Search" gets a raised circular button.
          if (route.name === "Search") {
            return (
              <View style={styles.searchBtn}>
                <Ionicons name="search" size={24} color={colors.white} />
              </View>
            );
          }
          const icons: Record<string, keyof typeof Ionicons.glyphMap> = {
            Home: focused ? "home" : "home-outline",
            Categories: focused ? "grid" : "grid-outline",
            Orders: focused ? "receipt" : "receipt-outline",
            Cart: focused ? "cart" : "cart-outline",
          };
          if (route.name === "Cart") {
            return (
              <View>
                <Ionicons name={icons.Cart} size={size} color={color} />
                {count > 0 && (
                  <View style={styles.cartBadge}>
                    <Text style={styles.cartBadgeText}>{count > 9 ? "9+" : count}</Text>
                  </View>
                )}
              </View>
            );
          }
          return <Ionicons name={icons[route.name]} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Categories" component={CategoriesScreen} />
      <Tab.Screen name="Search" component={SearchScreen} options={{ tabBarLabel: "" }} />
      <Tab.Screen name="Orders" component={OrdersScreen} />
      <Tab.Screen name="Cart" component={CartScreen} options={{ title: "My Cart" }} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    height: 64,
    paddingBottom: 8,
    paddingTop: 8,
    backgroundColor: colors.surface,
    borderTopWidth: 0,
    ...shadow.card,
  },
  searchBtn: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
    ...shadow.card,
  },
  cartBadge: {
    position: "absolute",
    top: -6,
    right: -10,
    backgroundColor: colors.accent,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  cartBadgeText: { color: colors.white, fontSize: 10, fontWeight: "800" },
});
