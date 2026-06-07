export type RootStackParamList = {
  Tabs: undefined;
  Login: undefined;
  Register: undefined;
  PartDetail: { id: number; title?: string };
  CategoryParts: { id: number; name: string };
  SellerProfile: { id: number; name?: string };
  Vehicles: undefined;
  VehicleDetail: { id: number; title?: string };
  VehicleForm: { id?: number };
  MyVehicles: undefined;
  OemSearch: undefined;
  OemPartDetail: { id: number; oem_number?: string };
  OrderDetail: { id: number };
  Tracking: { shipmentId: number };
  Checkout: undefined;
  Inquiries: undefined;
  Cart: undefined;
  Orders: undefined;
  Vendors: undefined;
  PartSearch: undefined;
  SellerDashboard: undefined;
  MyListings: undefined;
  PartForm: { id?: number };
  Sales: undefined;
};

export type TabParamList = {
  Home: undefined;
  Discover: undefined;
  Messages: undefined;
  Sell: undefined;
  Account: undefined;
};
