export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type TabParamList = {
  Dashboard: undefined;
  Listings: undefined;
  Orders: undefined;
  Inquiries: undefined;
  Store: undefined;
};

export type RootStackParamList = {
  Tabs: undefined;
  PartForm: { id?: number };
  OrderDetail: { id: number };
};
