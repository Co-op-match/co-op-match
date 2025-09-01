export type ArticleType = 'news' | 'career';

export interface Article {
  ID?: number;
  title: string;
  subtitle?: string;
  body?: string;
  category?: string;
  type: ArticleType;
  media_type?: 'article' | 'video';
  cover_image?: string;
  is_published?: boolean;
  published_at?: string | null;
  CreatedAt?: string;
  UpdatedAt?: string;
}
