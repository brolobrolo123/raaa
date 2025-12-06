export const PROFILE_ARTICLES_PAGE_SIZE = 5;

export type ProfileArticleRecord = {
  id: string;
  title: string;
  summary: string;
  createdAt: Date;
  score: number;
  section: {
    name: string;
    slug: string;
  };
};

export type SerializedProfileArticle = Omit<ProfileArticleRecord, "createdAt"> & {
  createdAt: string;
};
