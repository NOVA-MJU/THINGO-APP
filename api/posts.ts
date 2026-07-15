import { client } from './client';

export type CommunityCategory = 'ALL' | 'FREE' | 'NOTICE';
export type BoardSortBy = 'createdAt' | 'title' | 'likeCount' | 'viewCount';
export type SortDirection = 'ASC' | 'DESC';

type ApiResponse<T> = {
  status: string;
  data: T;
  timestamp: string;
};

type BoardResponse = {
  uuid: string;
  title: string;
  content?: string;
  previewContent?: string;
  contentPreview?: string;
  imageUrl?: string | null;
  boardImageUrl?: string | null;
  thumbnailUrl?: string | null;
  communityCategory?: CommunityCategory;
  viewCount: number;
  published: boolean;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  likeCount: number;
  commentCount: number;
  author: string;
  authorUuid?: string;
  liked?: boolean;
  isLiked?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
  popular?: boolean;
};

type BoardPageResponse = {
  content: BoardResponse[];
  totalElements: number;
  totalPages: number;
};

type CommentResponse = {
  commentUUID: string;
  content: string;
  nickname: string;
  likeCount: number;
  createdAt: string;
  liked?: boolean;
  replies?: CommentResponse[] | null;
};

export type Board = {
  uuid: string;
  title: string;
  content: string;
  previewContent: string;
  imageUrl: string | null;
  communityCategory: CommunityCategory | null;
  viewCount: number;
  published: boolean;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  likeCount: number;
  commentCount: number;
  author: string;
  authorUuid: string | null;
  liked: boolean;
  canEdit: boolean;
  canDelete: boolean;
  popular: boolean;
};

export type BoardListPage = {
  boards: Board[];
  totalElements: number;
  totalPages: number;
};

export type CreateBoardRequest = {
  title: string;
  content: string;
  contentPreview: string;
  imageUrl?: string | null;
  published?: boolean;
  communityCategory: Exclude<CommunityCategory, 'ALL'>;
};

export type UpdateBoardRequest = CreateBoardRequest;

export type Comment = {
  commentUUID: string;
  content: string;
  nickname: string;
  likeCount: number;
  createdAt: string;
  liked: boolean;
  replies: Comment[];
};

export type CreateCommentRequest = {
  content: string;
};

function normalizeBoard(board: BoardResponse): Board {
  return {
    uuid: board.uuid,
    title: board.title,
    content: board.content ?? '',
    previewContent: board.previewContent ?? board.contentPreview ?? '',
    imageUrl: board.imageUrl ?? board.boardImageUrl ?? board.thumbnailUrl ?? null,
    communityCategory: board.communityCategory ?? null,
    viewCount: board.viewCount,
    published: board.published,
    publishedAt: board.publishedAt,
    createdAt: board.createdAt,
    updatedAt: board.updatedAt,
    likeCount: board.likeCount,
    commentCount: board.commentCount,
    author: board.author,
    authorUuid: board.authorUuid ?? null,
    liked: typeof board.liked === 'boolean' ? board.liked : Boolean(board.isLiked),
    canEdit: Boolean(board.canEdit),
    canDelete: Boolean(board.canDelete),
    popular: Boolean(board.popular),
  };
}

function normalizeComment(comment: CommentResponse): Comment {
  return {
    commentUUID: comment.commentUUID,
    content: comment.content,
    nickname: comment.nickname,
    likeCount: comment.likeCount,
    createdAt: comment.createdAt,
    liked: Boolean(comment.liked),
    replies: Array.isArray(comment.replies) ? comment.replies.map(normalizeComment) : [],
  };
}

export async function getBoards({
  page = 0,
  size = 10,
  communityCategory = 'ALL',
  sortBy = 'createdAt',
  direction = 'DESC',
}: {
  page?: number;
  size?: number;
  communityCategory?: CommunityCategory;
  sortBy?: BoardSortBy;
  direction?: SortDirection;
} = {}): Promise<BoardListPage> {
  const { data } = await client.get<ApiResponse<BoardPageResponse>>('/boards', {
    params: { page, size, communityCategory, sortBy, direction },
  });

  return {
    boards: data.data.content.map(normalizeBoard),
    totalElements: data.data.totalElements,
    totalPages: data.data.totalPages,
  };
}

export async function getBoardDetail(boardUUID: string): Promise<Board> {
  const { data } = await client.get<ApiResponse<BoardResponse>>(`/boards/${boardUUID}`);
  return normalizeBoard(data.data);
}

export async function createBoard(body: CreateBoardRequest): Promise<Board> {
  const { data } = await client.post<ApiResponse<BoardResponse>>('/boards', body);
  return normalizeBoard(data.data);
}

export async function updateBoard(boardUUID: string, body: UpdateBoardRequest): Promise<Board> {
  const { data } = await client.patch<ApiResponse<BoardResponse>>(`/boards/${boardUUID}`, body);
  return normalizeBoard(data.data);
}

export async function deleteBoard(boardUUID: string): Promise<void> {
  await client.delete(`/boards/${boardUUID}`);
}

export async function getBoardComments(boardUUID: string): Promise<Comment[]> {
  const { data } = await client.get<ApiResponse<CommentResponse[]>>(
    `/boards/${boardUUID}/comments`
  );
  return data.data.map(normalizeComment);
}

export async function createBoardComment(
  boardUUID: string,
  body: CreateCommentRequest
): Promise<Comment> {
  const { data } = await client.post<ApiResponse<CommentResponse>>(
    `/boards/${boardUUID}/comments`,
    body
  );
  return normalizeComment(data.data);
}

export async function createCommentReply(
  boardUUID: string,
  parentCommentUUID: string,
  body: CreateCommentRequest
): Promise<Comment> {
  const { data } = await client.post<ApiResponse<CommentResponse>>(
    `/boards/${boardUUID}/comments/${parentCommentUUID}/reply`,
    body
  );
  return normalizeComment(data.data);
}

export async function deleteBoardComment(commentUUID: string): Promise<void> {
  await client.delete(`/boards/comments/${commentUUID}`);
}

export async function toggleBoardLike(boardUUID: string): Promise<void> {
  await client.post(`/boards/${boardUUID}/like`);
}

export async function toggleCommentLike(boardUUID: string, commentUUID: string): Promise<void> {
  await client.post(`/boards/${boardUUID}/comments/${commentUUID}/like`);
}

export async function getHotBoards(params?: { page?: number; size?: number }): Promise<Board[]> {
  const { data } = await client.get<ApiResponse<BoardResponse[]>>('/boards/hot', { params });
  return data.data.map(normalizeBoard);
}
