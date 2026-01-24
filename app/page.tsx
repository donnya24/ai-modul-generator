"use client";

import { useState } from "react";

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const res = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mapel: "Informatika",
        kelas: "Fase D / Kelas 8",
        materi: "Algoritma dan Flowchart",
        model: "Problem Based Learning",
        profil: "Bernalar Kritis dan Mandiri",
      }),
    });

    const data = await res.json();
    setResult(data.data);
    setLoading(false);
  }

  return (
    <main className="p-10 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">
        Generator Modul Ajar Kurikulum Merdeka
      </h1>

      <form onSubmit={handleSubmit}>
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded"
          disabled={loading}
        >
          {loading ? "Memproses..." : "Generate Modul"}
        </button>
      </form>

      {result && (
        <pre className="mt-6 p-4 bg-gray-100 whitespace-pre-wrap">{result}</pre>
      )}
    </main>
  );
}
