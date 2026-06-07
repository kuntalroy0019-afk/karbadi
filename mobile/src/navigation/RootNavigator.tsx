import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React from "react";

import { useAuth } from "../context/AuthContext";
import { Loading } from "../components/ui";
import CheckoutScreen from "../screens/CheckoutScreen";
import CategoryPartsScreen from "../screens/CategoryPartsScreen";
import InquiriesScreen from "../screens/InquiriesScreen";
import LoginScreen from "../screens/LoginScreen";
import MyListingsScreen from "../screens/MyListingsScreen";
import OemPartDetailScreen from "../screens/OemPartDetailScreen";
import OemSearchScreen from "../screens/OemSearchScreen";
import OrderDetailScreen from "../screens/OrderDetailScreen";
import PartDetailScreen from "../screens/PartDetailScreen";
import PartFormScreen from "../screens/PartFormScreen";
import RegisterScreen from "../screens/RegisterScreen";
import SalesScreen from "../screens/SalesScreen";
import SellerDashboardScreen from "../screens/SellerDashboardScreen";
import SellerProfileScreen from "../screens/SellerProfileScreen";
import TrackingScreen from "../screens/TrackingScreen";
import VehicleDetailScreen from "../screens/VehicleDetailScreen";
import VehicleFormScreen from "../screens/VehicleFormScreen";
import VehiclesScreen from "../screens/VehiclesScreen";
import MyVehiclesScreen from "../screens/MyVehiclesScreen";
import { colors } from "../theme";
import TabNavigator from "./TabNavigator";
import { RootStackParamList } from "./types";

const Stack = createNativeStackNavigator<RootStackParamList>();

const headerOptions = {
  headerStyle: { backgroundColor: colors.primary },
  headerTintColor: colors.white,
  headerTitleStyle: { fontWeight: "700" as const },
};

export default function RootNavigator() {
  const { loading } = useAuth();
  if (loading) return <Loading label="Starting Karbadi…" />;

  return (
    <Stack.Navigator screenOptions={headerOptions}>
      <Stack.Screen name="Tabs" component={TabNavigator} options={{ headerShown: false }} />
      <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Register" component={RegisterScreen} options={{ title: "Create Account" }} />
      <Stack.Screen name="PartDetail" component={PartDetailScreen} options={{ title: "Part Details" }} />
      <Stack.Screen name="CategoryParts" component={CategoryPartsScreen} options={({ route }) => ({ title: route.params.name })} />
      <Stack.Screen name="SellerProfile" component={SellerProfileScreen} options={{ title: "Seller" }} />
      <Stack.Screen name="Vehicles" component={VehiclesScreen} options={{ title: "Buy / Sell Vehicles" }} />
      <Stack.Screen name="VehicleDetail" component={VehicleDetailScreen} options={{ title: "Vehicle" }} />
      <Stack.Screen name="VehicleForm" component={VehicleFormScreen} options={({ route }) => ({ title: route.params?.id ? "Edit Vehicle" : "Sell Your Vehicle" })} />
      <Stack.Screen name="MyVehicles" component={MyVehiclesScreen} options={{ title: "My Vehicle Listings" }} />
      <Stack.Screen name="OemSearch" component={OemSearchScreen} options={{ title: "OEM Part Finder" }} />
      <Stack.Screen name="OemPartDetail" component={OemPartDetailScreen} options={{ title: "OEM Part" }} />
      <Stack.Screen name="OrderDetail" component={OrderDetailScreen} options={{ title: "Order" }} />
      <Stack.Screen name="Tracking" component={TrackingScreen} options={{ title: "Track Shipment" }} />
      <Stack.Screen name="Checkout" component={CheckoutScreen} options={{ title: "Checkout" }} />
      <Stack.Screen name="Inquiries" component={InquiriesScreen} options={{ title: "Account" }} />
      <Stack.Screen name="SellerDashboard" component={SellerDashboardScreen} options={{ title: "Seller Dashboard" }} />
      <Stack.Screen name="MyListings" component={MyListingsScreen} options={{ title: "My Listings" }} />
      <Stack.Screen name="PartForm" component={PartFormScreen} options={({ route }) => ({ title: route.params?.id ? "Edit Listing" : "New Listing" })} />
      <Stack.Screen name="Sales" component={SalesScreen} options={{ title: "Sales" }} />
    </Stack.Navigator>
  );
}
