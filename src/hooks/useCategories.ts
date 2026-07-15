import { useState, useCallback } from 'react';
import type { Category, GetCategoriesQuery } from '../types/category';
import { getCategories } from '../services/categoryService';

interface UseCategoriesReturn {
  categories: Category[];
  loading: boolean;
  error: string | null;
  fetchCategories: (params?: GetCategoriesQuery) => Promise<void>;
}

export const useCategories = (): UseCategoriesReturn => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = useCallback(async (params?: GetCategoriesQuery) => {
    setLoading(true);
    setError(null);
    try {
      const res = await getCategories(params);
      setCategories(res.data);
    } catch (err: any) {
      const msg = err.message || 'Không thể tải danh sách danh mục';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  return { categories, loading, error, fetchCategories };
};
