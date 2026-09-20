export interface GlobalSearchResultItem {
  id: string;
  category: 'PEOPLE' | 'TASKS' | 'PRODUCTS' | 'ORDERS' | 'DOCUMENTS' | 'GOALS' | 'ANNOUNCEMENTS';
  title: string;
  subtitle: string;
  url: string;
  icon: string;
}

export interface GlobalSearchResponse {
  success: boolean;
  query: string;
  total: number;
  results: {
    people: any[];
    tasks: any[];
    announcements: any[];
    documents: any[];
    goals: any[];
    products: any[];
    orders: any[];
  };
  items: GlobalSearchResultItem[];
}
