// Types for Bookmark APIs

export interface BookmarkSolution {
  _id: string
  title: string
  thumbnailUrl: string
  tags: string[]
  fileExtension: string
  fileSizeBytes: number
  isPublic: boolean
  createdAt: string
  updatedAt: string
}

export interface Bookmark {
  _id: string
  solution: BookmarkSolution
  note: string
  createdAt: string
}

export interface PaginationMeta {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface GetBookmarksResponse {
  message: string
  data: Bookmark[]
  meta: PaginationMeta
}

export interface AddBookmarkRequest {
  note?: string
}

export interface AddBookmarkResponse {
  message: string
  data: {
    _id: string
    accountId: string
    solutionId: string
    note: string
    createdAt: string
  }
}

export interface RemoveBookmarkResponse {
  message: string
  data: null
}
