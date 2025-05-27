// src/components/NewPostForm.jsx
import React, { useState } from "react";
import { useParams } from "react-router-dom";
import './NewPostForm.css';

export default function NewPostForm({ user, onPostCreated }) {
  const { county } = useParams();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [files, setFiles] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      alert("Trebuie să fii logat ca să postezi.");
      return;
    }

    setSubmitting(true);
    try {
      const form = new FormData();
      form.append("user_id", user.id);
      form.append("title", title);
      form.append("content", content);
      form.append("county", county || "");
      Array.from(files).forEach((f) => form.append("photos", f));

      const res = await fetch("/api/posts", { method: "POST", body: form });
      if (!res.ok) {
        let errMsg = `Eroare la postare (${res.status})`;
        try {
          const body = await res.json();
          errMsg = body.error || JSON.stringify(body);
        } catch {}
        throw new Error(errMsg);
      }

      onPostCreated && onPostCreated();

      setTitle("");
      setContent("");
      setFiles([]);
    } catch (err) {
      console.error(err);
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="new-post-form">
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Titlu"
        required
        disabled={submitting}
      />
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Conținut"
        required
        disabled={submitting}
      />
      <input
        type="file"
        multiple
        accept="image/*"
        onChange={(e) => setFiles(e.target.files)}
        disabled={submitting}
      />
      <button type="submit" disabled={submitting || !title.trim() || !content.trim()}>
        {submitting ? 'Se postează...' : 'Postează'}
      </button>
    </form>
  );
}
