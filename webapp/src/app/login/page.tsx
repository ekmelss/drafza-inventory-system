"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Clear any corrupted localStorage on mount
  useEffect(() => {
    try {
      const userStr = localStorage.getItem("user");
      if (userStr === "undefined" || userStr === "null") {
        localStorage.removeItem("user");
        localStorage.removeItem("token");
      }
    } catch (error) {
      localStorage.clear();
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Invalid credentials");
      }

      // Store token
      if (data.token) {
        localStorage.setItem("token", data.token);
      }

      // Store user object (make sure it exists and is valid)
      if (data.user && typeof data.user === 'object') {
        localStorage.setItem("user", JSON.stringify(data.user));
      }

      console.log("✅ Login successful:", data.user);
      
      router.push("/dashboard");
    } catch (err: any) {
      console.error("❌ Login error:", err);
      setError(err.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-stone-100 to-amber-100">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <Card className="w-[380px] rounded-2xl shadow-xl border border-amber-200 bg-white/90 backdrop-blur">
          <CardContent className="p-8">
            <div className="text-center mb-6">
              <h1 className="text-3xl font-serif tracking-wide text-amber-800">D'RAFZA</h1>
              <p className="text-sm text-stone-500 mt-1">Perpetual Inventory System</p>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg"
              >
                <p className="text-red-600 text-sm text-center">{error}</p>
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm text-stone-600 mb-1">Username</label>
                <input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full rounded-xl border border-stone-300 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  placeholder="drafza1, drafza2, or drafza3"
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm text-stone-600 mb-1">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-stone-300 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  placeholder="🔐"
                  required
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-amber-700 hover:bg-amber-800 text-white tracking-wide py-3"
              >
                {loading ? "Authenticating…" : "Login"}
              </Button>
            </form>

            <div className="mt-6 pt-4 border-t border-stone-200">
              <div className="text-xs text-center text-stone-400 space-y-1">
                <p>📍 Backend: {process.env.NEXT_PUBLIC_API_URL || "Not configured"}</p>
                <p>Ramadan Season {new Date().getFullYear()}</p>
                <p>© D'RAFZA · Traditional Clothing Store</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}