export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type TabParamList = {
  Dashboard: undefined;
  Inquiries: undefined;
  Orders: undefined;
  Listings: undefined;
  More: undefined;
};

export type RootStackParamList = {
  Tabs: undefined;
  PartForm: { id?: number };
  OrderDetail: { id: number };
  Storefront: undefined;
};
