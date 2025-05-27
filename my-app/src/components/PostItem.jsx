import React, { useState } from "react";
import './PostItem.css'; 

export default function PostItem({ post, user, onLike, onComment }) {
  const [commentText, setCommentText] = useState("");
  const [isCommenting, setIsCommenting] = useState(false);

  const handleSubmitComment = async () => {
    if (!commentText.trim()) return;
    
    setIsCommenting(true);
    try {
      await onComment(post.id, commentText);
      setCommentText("");
    } catch (error) {
      console.error("Error posting comment:", error);
    } finally {
      setIsCommenting(false);
    }
  };

  return (
    <div className="post-item">
      <div className="post-header">
        <strong>{post.username}</strong>
        <small>{new Date(post.created_at).toLocaleString()}</small>
      </div>
      
      <h3>{post.title}</h3>
      <p>{post.content}</p>
      
      <div className="post-photos">
        {post.photos?.map(p => (
          <img key={p.id} src={p.image_url} alt="Postare" />
        ))}
      </div>

      
      <div className="post-actions">
        <button onClick={() => onLike(post.id)}>
          👍 {post.likes || 0}
        </button>
        <button onClick={() => {}}>💬 {post.comments?.length || 0}</button>
      </div>
      
      <div className="comments-section">
        {post.comments?.map((c) => (
          <div key={c.id} className="comment">
            <strong>{c.username}</strong>: {c.content}
          </div>
        ))}
      </div>
      
      {user && (
        <div className="add-comment">
          <input
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Scrie un comentariu..."
            onKeyPress={(e) => e.key === 'Enter' && handleSubmitComment()}
          />
          <button 
            onClick={handleSubmitComment}
            disabled={isCommenting || !commentText.trim()}
          >
            {isCommenting ? 'Se postează...' : 'Trimite'}
          </button>
        </div>
      )}
    </div>
  );
}