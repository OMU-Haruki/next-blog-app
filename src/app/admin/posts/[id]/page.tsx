"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner } from "@fortawesome/free-solid-svg-icons";
import { twMerge } from "tailwind-merge";

// カテゴリをフェッチしたときのレスポンスのデータ型
type CategoryApiResponse = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
};

// 投稿記事をフェッチしたときのレスポンスのデータ型
type PostApiResponse = {
  id: string;
  title: string;
  content: string;
  coverImageURL: string;
  createdAt: string;
  updatedAt: string;
  categories: {
    category: {
      id: string;
      name: string;
    };
  }[];
};

// 投稿記事のカテゴリ選択用のデータ型
type SelectableCategory = {
  id: string;
  name: string;
  isSelect: boolean;
};

// 投稿記事の編集 (削除を含む) ページ
const Page: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fetchErrorMsg, setFetchErrorMsg] = useState<string | null>(null);

  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newCoverImageURL, setNewCoverImageURL] = useState("");

  // カテゴリ配列 (State)。取得中と取得失敗時は null、既存カテゴリが0個なら []
  const [checkableCategories, setCheckableCategories] = useState<
    SelectableCategory[] | null
  >(null);

  // 動的ルートパラメータから id を取得 （URL:/admin/posts/[id]）
  const { id } = useParams() as { id: string };
  const router = useRouter();

  // コンポーネントがマウントされたとき (初回レンダリングのとき) に1回だけ実行
  useEffect(() => {
    const fetchCategoriesAndPost = async () => {
      try {
        setIsLoading(true);

        // カテゴリ一覧と投稿記事のデータを並行して取得
        const [categoriesRes, postRes] = await Promise.all([
          fetch("/api/categories", { method: "GET", cache: "no-store" }),
          fetch(`/api/posts/${id}`, { method: "GET", cache: "no-store" }),
        ]);

        if (!categoriesRes.ok) {
          throw new Error(
            `カテゴリ一覧の取得に失敗しました: ${categoriesRes.status}`
          );
        }
        if (!postRes.ok) {
          throw new Error(
            `投稿記事の取得に失敗しました: ${postRes.status}`
          );
        }

        const categoriesData =
          (await categoriesRes.json()) as CategoryApiResponse[];
        const postData = (await postRes.json()) as PostApiResponse;

        setNewTitle(postData.title);
        setNewContent(postData.content);
        setNewCoverImageURL(postData.coverImageURL);

        // 投稿記事に紐づいているカテゴリIDのセットを作成
        const selectedCategoryIds = new Set(
          postData.categories.map((c) => c.category.id)
        );

        // カテゴリ一覧を SelectableCategory 形式に変換し、選択状態を反映
        setCheckableCategories(
          categoriesData.map((category) => ({
            id: category.id,
            name: category.name,
            isSelect: selectedCategoryIds.has(category.id),
          }))
        );
      } catch (error) {
        const errorMsg =
          error instanceof Error
            ? error.message
            : `予期せぬエラーが発生しました ${error}`;
        console.error(errorMsg);
        setFetchErrorMsg(errorMsg);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCategoriesAndPost();
  }, [id]);

  // チェックボックスの状態 (State) を更新する関数
  const switchCategoryState = (categoryId: string) => {
    if (!checkableCategories) return;

    setCheckableCategories(
      checkableCategories.map((category) =>
        category.id === categoryId
          ? { ...category, isSelect: !category.isSelect }
          : category
      )
    );
  };

  const updateNewTitle = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewTitle(e.target.value);
  };

  const updateNewContent = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewContent(e.target.value);
  };

  const updateNewCoverImageURL = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewCoverImageURL(e.target.value);
  };

  // フォームの送信処理 (更新)
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const requestBody = {
        title: newTitle,
        content: newContent,
        coverImageURL: newCoverImageURL,
        categoryIds: checkableCategories
          ? checkableCategories.filter((c) => c.isSelect).map((c) => c.id)
          : [],
      };
      const requestUrl = `/api/admin/posts/${id}`;
      const res = await fetch(requestUrl, {
        method: "PUT",
        cache: "no-store",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!res.ok) {
        throw new Error(`${res.status}: ${res.statusText}`);
      }

      const postResponse = await res.json();
      setIsSubmitting(false);
      router.push(`/posts/${postResponse.id}`); // 投稿記事の詳細ページに移動
    } catch (error) {
      const errorMsg =
        error instanceof Error
          ? `投稿記事の更新に失敗しました\n${error.message}`
          : `予期せぬエラーが発生しました\n${error}`;
      console.error(errorMsg);
      window.alert(errorMsg);
      setIsSubmitting(false);
    }
  };

  // 削除ボタンの処理
  const handleDelete = async () => {
    if (!window.confirm(`投稿「${newTitle}」を本当に削除しますか？`)) {
      return;
    }

    setIsSubmitting(true);
    try {
      const requestUrl = `/api/admin/posts/${id}`;
      const res = await fetch(requestUrl, {
        method: "DELETE",
        cache: "no-store",
      });

      if (!res.ok) {
        throw new Error(`${res.status}: ${res.statusText}`);
      }

      router.push("/admin/posts"); // 投稿記事の一覧ページに移動
    } catch (error) {
      const errorMsg =
        error instanceof Error
          ? `投稿記事の削除に失敗しました\n${error.message}`
          : `予期せぬエラーが発生しました\n${error}`;
      console.error(errorMsg);
      window.alert(errorMsg);
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="text-gray-500">
        <FontAwesomeIcon icon={faSpinner} className="mr-1 animate-spin" />
        Loading...
      </div>
    );
  }

  if (!checkableCategories) {
    return <div className="text-red-500">{fetchErrorMsg}</div>;
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">投稿記事の編集・削除</h1>
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

      <form
        onSubmit={handleSubmit}
        className={twMerge("space-y-6", isSubmitting && "opacity-50")}
      >
        <div className="space-y-2">
          <label htmlFor="title" className="block font-bold text-slate-700">
            タイトル
          </label>
          <input
            type="text"
            id="title"
            name="title"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 focus:border-indigo-500 focus:outline-none"
            value={newTitle}
            onChange={updateNewTitle}
            placeholder="タイトルを記入してください"
            required
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="content" className="block font-bold text-slate-700">
            本文
          </label>
          <textarea
            id="content"
            name="content"
            className="min-h-[300px] w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 focus:border-indigo-500 focus:outline-none"
            value={newContent}
            onChange={updateNewContent}
            placeholder="本文を記入してください"
            required
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="coverImageURL" className="block font-bold text-slate-700">
            カバーイメージ (URL)
          </label>
          <input
            type="url"
            id="coverImageURL"
            name="coverImageURL"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 focus:border-indigo-500 focus:outline-none"
            value={newCoverImageURL}
            onChange={updateNewCoverImageURL}
            placeholder="カバーイメージのURLを記入してください"
            required
          />
          {newCoverImageURL && (
            <div className="mt-2 rounded-md border border-slate-200 bg-slate-50 p-2">
              <div className="text-xs text-slate-500 mb-1">プレビュー</div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={newCoverImageURL}
                alt="Preview"
                className="h-auto max-h-40 max-w-full rounded object-contain"
                onError={(e) => (e.currentTarget.style.display = "none")}
              />
            </div>
          )}
        </div>

        <div className="space-y-2">
          <div className="font-bold text-slate-700">カテゴリ</div>
          <div className="flex flex-wrap gap-2">
            {checkableCategories.length > 0 ? (
              checkableCategories.map((c) => (
                <label
                  key={c.id}
                  className={twMerge(
                    "flex cursor-pointer items-center space-x-2 rounded-md border px-3 py-2 transition-colors",
                    c.isSelect
                      ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                      : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                  )}
                >
                  <input
                    id={c.id}
                    type="checkbox"
                    checked={c.isSelect}
                    className="accent-indigo-500"
                    onChange={() => switchCategoryState(c.id)}
                  />
                  <span className="text-sm font-medium">{c.name}</span>
                </label>
              ))
            ) : (
              <div className="text-slate-500">選択可能なカテゴリが存在しません。</div>
            )}
          </div>
        </div>

        <div className="flex flex-col-reverse gap-4 pt-4 sm:flex-row sm:justify-end sm:gap-2">
          <button
            type="button"
            className={twMerge(
              "rounded-md border border-red-500 px-5 py-2 font-bold text-red-500 transition-colors",
              "hover:bg-red-50",
              "disabled:cursor-not-allowed disabled:opacity-50"
            )}
            onClick={handleDelete}
            disabled={isSubmitting}
          >
            削除
          </button>

          <button
            type="submit"
            className={twMerge(
              "rounded-md bg-indigo-500 px-5 py-2 font-bold text-white transition-colors",
              "hover:bg-indigo-600",
              "disabled:cursor-not-allowed disabled:opacity-50"
            )}
            disabled={isSubmitting}
          >
            記事を更新
          </button>
        </div>
      </form>
    </main>
  );
};

export default Page;
