import { z } from 'zod';

// GET /api/trends/radar (backend trend_service dict 응답, 계약 2.5절)

export const TrendingTagSchema = z.object({
  name: z.string(),
  count: z.number().int(),
  category: z.string(),
  recent_count: z.number().int(),
  velocity: z.string(),
  /** 대표 기사 id. 없으면 null */
  sample_news_id: z.number().int().nullable().optional(),
});
export type TrendingTag = z.infer<typeof TrendingTagSchema>;

export const CategoryShareSchema = z.object({
  name: z.string(),
  count: z.number().int(),
  percentage: z.number(),
});
export type CategoryShare = z.infer<typeof CategoryShareSchema>;

export const TechRadarDataSchema = z.object({
  updated_at: z.string(),
  total_analyzed: z.number().int(),
  surging_tags: z.array(TrendingTagSchema),
  categories: z.array(CategoryShareSchema),
  tags: z.array(TrendingTagSchema),
});
export type TechRadarData = z.infer<typeof TechRadarDataSchema>;
