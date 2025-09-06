export type ArticleType = 'news' | 'career';

export interface Article {
  ID?: number;
  title: string;
  subtitle?: string;
  body?: string;
  category?: string;
  type: ArticleType;
  is_published?: boolean;
  published_at?: string | null;
  CreatedAt?: string;
  UpdatedAt?: string;
}
