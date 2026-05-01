"use client"
import { useRef, useState } from "react";

export default function ImagenUploadAdmin({ onUpload }: { onUpload: (url: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPreview(URL.createObjectURL(file));
    setLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      // Si querés asociar a un producto, agregá productId
      // formData.append("productId", productoId)
      const res = await fetch("/api/admin/uploads", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al subir imagen");
      onUpload(data.url);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <input
        type="file"
        accept="image/*"
        ref={inputRef}
        onChange={handleFileChange}
        className="hidden"
      />
      <button
        type="button"
        className="px-3 py-2 bg-amber-600 text-white rounded hover:bg-amber-700"
        onClick={() => inputRef.current?.click()}
        disabled={loading}
      >
        {loading ? "Subiendo..." : "Subir Imagen"}
      </button>
      {preview && (
        <img src={preview} alt="Preview" className="w-32 h-32 object-cover rounded border" />
      )}
      {error && <div className="text-red-600 text-sm">{error}</div>}
    </div>
  );
}
