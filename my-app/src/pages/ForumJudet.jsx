// src/pages/ForumJudet.jsx
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import NewPostForm from "../components/NewPostForm";
import PostItem from "../components/PostItem";
import './ForumJudet.css';

export default function ForumJudet({ user }) {
  const { county } = useParams();
  const [posts, setPosts] = useState([]);
  const [filteredPosts, setFilteredPosts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch posts for the current county or all
  const fetchPosts = async () => {
    setLoading(true);
    setError(null);
    try {
      const endpoint = county
        ? `/api/forum/${county}`
        : `/api/forum`;
      const res = await fetch(endpoint);
      if (!res.ok) throw new Error(`Failed to fetch posts (${res.status})`);
      const data = await res.json();
      setPosts(data);
      setFilteredPosts(data);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [county]);

  // Filter posts when searchTerm changes
  useEffect(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) {
      setFilteredPosts(posts);
    } else {
      setFilteredPosts(
        posts.filter(p =>
          p.title.toLowerCase().includes(term) ||
          p.content.toLowerCase().includes(term)
        )
      );
    }
  }, [searchTerm, posts]);

  // Like handler
  const handleLike = async (postId) => {
    if (!user) return alert("Trebuie să fii logat ca să dai like.");
    try {
      const res = await fetch(`/api/posts/${postId}/like`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user.id }),
      });
      if (!res.ok) throw new Error(`Like failed (${res.status})`);
      setPosts(prev =>
        prev.map(p =>
          p.id === postId ? { ...p, likes: (p.likes || 0) + 1 } : p
        )
      );
    } catch (err) {
      console.error(err);
      alert("Eroare la like");
    }
  };

  // Comment handler
  const handleComment = async (postId, content) => {
    if (!user) return alert("Trebuie să fii logat ca să comentezi.");
    try {
      const res = await fetch(`/api/posts/${postId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user.id, content }),
      });
      if (!res.ok) throw new Error(`Comentariu eșuat (${res.status})`);
      const newComment = await res.json();
      setPosts(prev =>
        prev.map(p =>
          p.id === postId
            ? { ...p, comments: [...p.comments, newComment] }
            : p
        )
      );
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  };

  if (loading) return <p>Se încarcă postările...</p>;
  if (error) return <p>Eroare: {error}</p>;

  return (
    <div className="county-forum">
      <div className="search-bar">
        <input
          type="text"
          placeholder="Caută un cuvânt..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>
      {user && county &&(
        <NewPostForm
          user={user}
          county={county}
          onPostCreated={post =>  fetchPosts()}
        />
      )}

      

      {filteredPosts.length === 0 ? (
        <p>Nu există postări pentru {county || "toate județele"}.</p>
      ) : (
        filteredPosts.map(post => (
          <PostItem
            key={post.id}
            post={post}
            user={user}
            onLike={handleLike}
            onComment={handleComment}
          />
        ))
      )}
    </div>
  );
}
