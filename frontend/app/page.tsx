
"use client";

import { supabase } from "@/lib/supabase";

export default function Home() {
  const login = async () => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: "kyiooo@naver.com",
      password: "12345678!",

    });

    if (error) {
      console.error("LOGIN ERROR:", error);
      return;
    }

    if (!data.session) {
      console.error("NO SESSION RETURNED", data);
      return;
    }
    console.log("SESSION:", data.session);
    console.log("ACCESS_TOKEN:", data.session?.access_token);
  };

  return (
    <div style={{ padding: 40 }}>
      <h1>Supabase 로그인 테스트</h1>
      <button
        style={{ padding: "10px 20px", fontSize: 16 }}
        onClick={login}
      >
        로그인해서 토큰 받기
      </button>
    </div>
  );
}