"use client";
import { useState, useEffect } from "react";
import type { Post } from "@/app/_types/Post";
import type { Category } from "@/app/_types/Category";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner } from "@fortawesome/free-solid-svg-icons";
import Link from "next/link";
import { twMerge } from "tailwind-merge";

const Page: React.FC = () => {
  const [posts, setPosts] = useState<Post[] | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // フィルタ・ソート・検索用のState
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<Set<string>>(
    new Set()
  );
  const [categoryMatchMode, setCategoryMatchMode] = useState<"or" | "and">("or");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc"); // デフォルトは新しい順

  const fetchPosts = async () => {
    try {
      // 自作のAPIから記事データを取得
      const requestUrl = `/api/posts`;
      const response = await fetch(requestUrl, {
        method: "GET",
        cache: "no-store",
      });
      if (!response.ok) {
        throw new Error("データの取得に失敗しました");
      }
      const data = await response.json();
      setPosts(
        data.map((post: any) => ({
          id: post.id,
          title: post.title,
          content: post.content,
          createdAt: post.createdAt,
          categories: post.categories.map((c: any) => c.category),
          coverImage: {
            url: post.coverImageURL,
            width: 1000,
            height: 1000,
          },
        })) as Post[]
      );
    } catch (e) {
      setFetchError(
        e instanceof Error ? e.message : "予期せぬエラーが発生しました"
      );
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/categories", {
        method: "GET",
        cache: "no-store",
      });
      if (res.ok) {
        const data = await res.json();
        setCategories(data as Category[]);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchPosts();
    fetchCategories();
  }, []);

  // フィルタリングとソートを実行した結果を取得
  const filteredPosts = posts
    ? posts
        .filter((post) => {
          // 検索キーワードでフィルタ (タイトルまたは本文)
          const searchLower = searchQuery.toLowerCase();
          const matchesSearch =
            post.title.toLowerCase().includes(searchLower) ||
            post.content.toLowerCase().includes(searchLower);

          // カテゴリでフィルタ
          const matchesCategory =
            selectedCategoryIds.size === 0 ||
            (categoryMatchMode === "or"
              ? post.categories.some((c) => selectedCategoryIds.has(c.id))
              : Array.from(selectedCategoryIds).every((id) =>
                  post.categories.some((c) => c.id === id)
                ));

          return matchesSearch && matchesCategory;
        })
        .sort((a, b) => {
          const dateA = new Date(a.createdAt).getTime();
          const dateB = new Date(b.createdAt).getTime();
          return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
        })
    : [];

  const toggleCategory = (categoryId: string) => {
    const newSelectedCategoryIds = new Set(selectedCategoryIds);
    if (newSelectedCategoryIds.has(categoryId)) {
      newSelectedCategoryIds.delete(categoryId);
    } else {
      newSelectedCategoryIds.add(categoryId);
    }
    setSelectedCategoryIds(newSelectedCategoryIds);
  };


  const handleDelete = async (post: Post) => {
    if (!window.confirm(`投稿「${post.title}」を本当に削除しますか？`)) {
      return;
    }

    setIsSubmitting(true);
    try {
      const requestUrl = `/api/admin/posts/${post.id}`;
      const res = await fetch(requestUrl, {
        method: "DELETE",
        cache: "no-store",
      });

      if (!res.ok) {
        throw new Error(`${res.status}: ${res.statusText}`);
      }

      // 削除成功後にリストを再取得
      await fetchPosts();
    } catch (error) {
      const errorMsg =
        error instanceof Error
          ? `投稿記事の削除に失敗しました\n${error.message}`
          : `予期せぬエラーが発生しました\n${error}`;
      console.error(errorMsg);
      window.alert(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (fetchError) {
    return <div>{fetchError}</div>;
  }

  if (!posts) {
    return (
      <div className="text-gray-500">
        <FontAwesomeIcon icon={faSpinner} className="mr-1 animate-spin" />
        Loading...
      </div>
    );
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">投稿記事の管理</h1>
        <Link
          href="/admin/posts/new"
          className="w-fit rounded-md bg-indigo-500 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-indigo-600 sm:text-base"
        >
          新規作成
        </Link>
      </div>

      <div className="mb-6 rounded-md border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid gap-4 sm:grid-cols-2">
          {/* 検索ボックス */}
          <div className="flex flex-col gap-1">
            <label
              htmlFor="search"
              className="text-sm font-bold text-slate-700"
            >
              検索
            </label>
            <input
              type="text"
              id="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="タイトル・本文を検索"
              className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
            />
          </div>

          {/* ソート順 */}
          <div className="flex flex-col gap-1">
            <label htmlFor="sort" className="text-sm font-bold text-slate-700">
              並び替え（作成日）
            </label>
            <select
              id="sort"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as "desc" | "asc")}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
            >
              <option value="desc">新しい順</option>
              <option value="asc">古い順</option>
            </select>
          </div>
        </div>

        {/* カテゴリフィルター */}
        <div className="mt-4 border-t border-slate-200 pt-4">
          <div className="mb-2 flex items-center justify-between">
            <label className="text-sm font-bold text-slate-700">
              カテゴリで絞り込み
            </label>
            <div className="flex rounded-md border border-slate-300">
              <button
                className={twMerge(
                  "px-3 py-1 text-xs font-medium transition-colors first:rounded-l-md last:rounded-r-md",
                  categoryMatchMode === "or"
                    ? "bg-indigo-100 text-indigo-700"
                    : "bg-white text-slate-500 hover:bg-slate-50"
                )}
                onClick={() => setCategoryMatchMode("or")}
              >
                OR
              </button>
              <div className="w-px bg-slate-300" />
              <button
                className={twMerge(
                  "px-3 py-1 text-xs font-medium transition-colors first:rounded-l-md last:rounded-r-md",
                  categoryMatchMode === "and"
                    ? "bg-indigo-100 text-indigo-700"
                    : "bg-white text-slate-500 hover:bg-slate-50"
                )}
                onClick={() => setCategoryMatchMode("and")}
              >
                AND
              </button>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              className={twMerge(
                "rounded-md border px-3 py-1 text-sm transition-colors",
                selectedCategoryIds.size === 0
                  ? "border-indigo-500 bg-indigo-50 font-bold text-indigo-700"
                  : "border-slate-300 text-slate-700 hover:bg-slate-50"
              )}
              onClick={() => setSelectedCategoryIds(new Set())}
            >
              すべて
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                className={twMerge(
                  "rounded-md border px-3 py-1 text-sm transition-colors",
                  selectedCategoryIds.has(c.id)
                    ? "border-indigo-500 bg-indigo-50 font-bold text-indigo-700"
                    : "border-slate-300 text-slate-700 hover:bg-slate-50"
                )}
                onClick={() => toggleCategory(c.id)}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {isSubmitting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="flex items-center rounded-lg bg-white px-8 py-4 shadow-lg">
            <FontAwesomeIcon
              icon={faSpinner}
              className="mr-2 animate-spin text-gray-500"
            />
            <div className="flex items-center text-gray-500">処理中...</div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {filteredPosts.length === 0 ? (
          <div className="rounded-md border border-slate-200 bg-white p-8 text-center text-slate-500">
            条件に一致する記事は見つかりませんでした。
          </div>
        ) : (
          filteredPosts.map((post) => (
            <div
              key={post.id}
              className="rounded-md border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
            >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <Link href={`/admin/posts/${post.id}`} className="flex-1 space-y-2">
                <div className="text-lg font-bold text-slate-800 transition-colors hover:text-indigo-600">
                  {post.title}
                </div>
                <div className="text-sm text-slate-500">
                  {new Date(post.createdAt).toLocaleDateString()}
                </div>
                <div className="flex flex-wrap gap-2">
                  {post.categories.map((category) => (
                    <span
                      key={category.id}
                      className="rounded-md border border-slate-300 px-2 py-0.5 text-xs text-slate-600"
                    >
                      {category.name}
                    </span>
                  ))}
                </div>
              </Link>

              <div className="flex space-x-3 self-end sm:self-center">
                <Link
                  href={`/admin/posts/${post.id}`}
                  className={twMerge(
                    "flex items-center justify-center rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition-colors",
                    "hover:bg-slate-50"
                  )}
                >
                  編集
                </Link>
                <button
                  className={twMerge(
                    "rounded-md bg-red-500 px-4 py-2 text-sm font-medium text-white transition-colors",
                    "hover:bg-red-600"
                  )}
                  onClick={() => handleDelete(post)}
                >
                  削除
                </button>
              </div>
            </div>
          </div>
        ))
      )}
      </div>
    </main>
  );
};

export default Page;