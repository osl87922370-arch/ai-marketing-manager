"use client";

import { supabase } from "@/lib/supabase";

export default function Home() {
  const login = async () => {
    const email = "osl87922370@gmail.com";
    const password = "012501!";

    let signInResult = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInResult.error) {
      console.log("SIGN IN FAILED, TRY SIGN UP:", signInResult.error.message);

      const signUpResult = await supabase.auth.signUp({
        email,
        password,
      });

      if (signUpResult.error) {
        console.error("SIGN UP ERROR:", signUpResult.error);
        return;
      }

      signInResult = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInResult.error) {
        console.error("RETRY LOGIN ERROR:", signInResult.error);
        return;
      }
    }

    if (!signInResult.data.session) {
      console.error("NO SESSION RETURNED", signInResult.data);
      return;
    }

    console.log("SESSION:", signInResult.data.session);
    console.log("ACCESS_TOKEN:", signInResult.data.session.access_token);
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

