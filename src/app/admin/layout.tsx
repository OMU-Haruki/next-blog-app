"use client";

import React from "react";
import { useAuth } from "@/app/_hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

interface Props {
  children: React.ReactNode;
}
const AdminLayout = ({ children }: Props) => {
  const router = useRouter();
  const { isLoading, session } = useAuth();

  useEffect(() => {
    // 認証状況の確認中は何もせずに戻る
    if (isLoading) {
      return;
    }
    // 認証確認後、未認証であればログインページにリダイレクト
    if (session === null) {
      router.replace("/login");
    }
  }, [isLoading, router, session]);

  // 認証済みが確認できるまでは何も表示しない
  if (!session) {
    return null;
  }
  return <>{children}</>;
};

export default AdminLayout;