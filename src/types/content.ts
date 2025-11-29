export interface Article {
  id: string;
  title: string;
  summary: string;
  score: number;
  createdAt: string | Date;
  coverColor?: string | null;
  coverImage?: string | null;
  section: {
    name: string;
    slug: string;
  };
  author: {
    username: string;
    image?: string | null;
    id?: string;
  };
  _count: {
    comments: number;
  };
  topComment?: {
    body: string;
    score: number;
    author: {
      username: string;
      image?: string | null;
    };
  } | null;
}

export interface CommentNodeDTO {
  id: string;
  body: string;
  parentId: string | null;
  score: number;
  createdAt: string;
  likedByViewer: boolean;
  author: {
    username: string;
    image: string | null;
  };
  replies: CommentNodeDTO[];
}
