"use client"

import { useEffect } from "react"
import { supabase } from "@/lib/supabase"

export default function AuthTestPage() {

    useEffect(() => {
        async function testLogin() {
            const { data, error } = await supabase.auth.signInWithPassword({
                email: "test@test.com",
                password: "12345678"
            })

            console.log("LOGIN:", data)
            console.log("ACCESS TOKEN:", data.session?.access_token)
            console.log("ERROR:", error)
        }

        testLogin()
    }, [])

    return <div>Supabase Auth Test Page</div>
}
