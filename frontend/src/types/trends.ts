export interface TrendingTag {
  name: string;
  count: number;
  category: string;
  recent_count: number;
  velocity: string;
  sample_news_id?: number;
}

export interface CategoryShare {
  name: string;
  count: number;
  percentage: number;
}

export interface TechRadarData {
  updated_at: string;
  total_analyzed: number;
  surging_tags: TrendingTag[];
  categories: CategoryShare[];
  tags: TrendingTag[];
}
