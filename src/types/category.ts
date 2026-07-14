// Types for Category API

export type SolutionCategoryType = 'system' | 'custom'

export interface Category {
  _id: string
  name: string
  slug: string
  description: string
  icon: string
  color: string
  type: SolutionCategoryType
  parentId: string | null
  acceptedExtensions: string[]
  sortOrder: number
  isActive: boolean
  documentCount: number
  createdAt: string
  updatedAt: string
}

export interface GetCategoriesQuery {
  parentId?: string | 'null'
  type?: SolutionCategoryType
  isActive?: boolean
}

export interface GetCategoriesResponse {
  message: string
  data: Category[]
}
