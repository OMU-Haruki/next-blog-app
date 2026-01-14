"use client";
import { useState, useEffect } from "react";
import type { Category } from "@/app/_types/Category";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner } from "@fortawesome/free-solid-svg-icons";
import Link from "next/link";
import { twMerge } from "tailwind-merge";

const Page: React.FC = () => {
  const [categories, setCategories] = useState<Category[] | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // カテゴリ一覧を取得する関数
  const fetchCategories = async () => {
    try {
      const requestUrl = `/api/categories`;
      const response = await fetch(requestUrl, {
        method: "GET",
        cache: "no-store",
      });
      if (!response.ok) {
        throw new Error("データの取得に失敗しました");
      }
      const data = await response.json();
      setCategories(data as Category[]);
    } catch (e) {
      setFetchError(
        e instanceof Error ? e.message : "予期せぬエラーが発生しました"
      );
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // 削除ボタンが押されたときの処理
  const handleDelete = async (category: Category) => {
    if (!window.confirm(`カテゴリ「${category.name}」を本当に削除しますか？`)) {
      return;
    }

    setIsSubmitting(true);
    try {
      const requestUrl = `/api/admin/categories/${category.id}`;
      const res = await fetch(requestUrl, {
        method: "DELETE",
        cache: "no-store",
      });

      if (!res.ok) {
        throw new Error(`${res.status}: ${res.statusText}`);
      }

      // 削除成功後にリストを再取得
      await fetchCategories();
    } catch (error) {
      const errorMsg =
        error instanceof Error
          ? `カテゴリの削除に失敗しました\n${error.message}`
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

  if (!categories) {
    return (
      <div className="text-gray-500">
        <FontAwesomeIcon icon={faSpinner} className="mr-1 animate-spin" />
        Loading...
      </div>
    );
  }

  const filteredCategories = categories.filter((category) =>
    category.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">カテゴリの管理</h1>

        <Link
          href="/admin/categories/new"
          className="rounded-md bg-indigo-500 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-indigo-600 sm:text-base"
        >
          新規作成
        </Link>
      </div>

      <div className="mb-6">
        <input
          type="text"
          className="w-full rounded-md border border-slate-300 px-4 py-2 focus:border-indigo-500 focus:outline-none"
          placeholder="カテゴリ名を検索"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
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
        {filteredCategories.length === 0 ? (
          <div className="py-8 text-center text-gray-500">
            一致するカテゴリはありません
          </div>
        ) : (
          filteredCategories.map((category) => (
            <div
              key={category.id}
              className="rounded-md border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
            >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <Link href={`/admin/categories/${category.id}`} className="flex-1">
                <div className="text-lg font-bold text-slate-800 transition-colors hover:text-indigo-600">
                  {category.name}
                </div>
              </Link>
              <div className="flex space-x-3">
                <Link
                  href={`/admin/categories/${category.id}`}
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
                  onClick={() => handleDelete(category)}
                >
                  削除
                </button>
              </div>
            </div>
          </div>
        )))}
      </div>
    </main>
  );
};

export default Page;
