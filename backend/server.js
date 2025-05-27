const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const multer = require("multer");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());
const corsOptions = {
  origin: "http://localhost:5173",
  credentials: true,
};

app.use(cors(corsOptions));
const upload = multer({ dest: "uploads/" });

const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

const db = pool;

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.post("/login", (req, res) => {
  console.log("Login request:", req.body);

  const { email, password } = req.body;
  db.query(
    "SELECT * FROM users WHERE email = ? AND password_hash = ?",
    [email, password],
    (err, data) => {
      if (err) {
        console.error("MySQL error on /login:", err);
        return res
          .status(500)
          .json({ code: err.code, message: err.sqlMessage });
      }
      if (data.length > 0) {
        const user = data[0];
        return res.json({
          token: "dummy_token",
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
          },
        });
      } else {
        res.status(401).json({ error: "Invalid credentials" });
      }
    }
  );
});

app.post("/signup", (req, res) => {
  const { email, password } = req.body;
  const username = email.split("@")[0];

  db.query(
    "INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)",
    [username, email, password],
    (err, result) => {
      if (err) {
        console.error("Eroare la înregistrare:", err.sqlMessage);
        return res.status(500).json({ error: "Eroare la înregistrare" });
      }
      res.json({
        token: "dummy_token",
        user: {
          id: result.insertId,
          username: username,
          email: email,
        },
      });
    }
  );
});
// toate postările
app.get("/counties", (req, res) => {
  const list = [
    { slug: "alba", name: "Alba" },
    { slug: "arad", name: "Arad" },
    { slug: "arges", name: "Argeș" },
    { slug: "bacau", name: "Bacău" },
    { slug: "bihor", name: "Bihor" },
    { slug: "bistrita-nasaud", name: "Bistrița-Năsăud" },
    { slug: "botosani", name: "Botoșani" },
    { slug: "brasov", name: "Brașov" },
    { slug: "braila", name: "Brăila" },
    { slug: "buzau", name: "Buzău" },
    { slug: "calarasi", name: "Călărași" },
    { slug: "caras-severin", name: "Caraș-Severin" },
    { slug: "cluj", name: "Cluj" },
    { slug: "constanta", name: "Constanța" },
    { slug: "covasna", name: "Covasna" },
    { slug: "dambovita", name: "Dâmbovița" },
    { slug: "dolj", name: "Dolj" },
    { slug: "galati", name: "Galați" },
    { slug: "giurgiu", name: "Giurgiu" },
    { slug: "gorj", name: "Gorj" },
    { slug: "harghita", name: "Harghita" },
    { slug: "hunedoara", name: "Hunedoara" },
    { slug: "ialomita", name: "Ialomița" },
    { slug: "iasi", name: "Iași" },
    { slug: "ilfov", name: "Ilfov" },
    { slug: "maramures", name: "Maramureș" },
    { slug: "mehedinti", name: "Mehedinți" },
    { slug: "mures", name: "Mureș" },
    { slug: "neamt", name: "Neamț" },
    { slug: "olt", name: "Olt" },
    { slug: "prahova", name: "Prahova" },
    { slug: "salaj", name: "Sălaj" },
    { slug: "satu-mare", name: "Satu Mare" },
    { slug: "sibiu", name: "Sibiu" },
    { slug: "suceava", name: "Suceava" },
    { slug: "teleorman", name: "Teleorman" },
    { slug: "timis", name: "Timiș" },
    { slug: "tulcea", name: "Tulcea" },
    { slug: "vaslui", name: "Vaslui" },
    { slug: "valcea", name: "Vâlcea" },
    { slug: "vrancea", name: "Vrancea" },
    { slug: "bucuresti", name: "București" },
  ];
  res.json(list);
});

// Create post + photos
app.post("/posts", upload.array("photos", 5), (req, res) => {
  const { user_id, title, content, county } = req.body;

  db.query(
    "SELECT id FROM destinations WHERE slug = ?",
    [county],
    (err, destRows) => {
      if (err) return res.status(500).json({ error: err.sqlMessage });
      if (destRows.length === 0) {
        return res.status(400).json({ error: "Județ inexistent" });
      }
      const destination_id = destRows[0].id;

      db.query(
        "INSERT INTO posts (user_id, destination_id, title, content) VALUES (?, ?, ?, ?)",
        [user_id, destination_id, title, content],
        (err2, result) => {
          if (err2) return res.status(500).json({ error: err2.sqlMessage });
          const postId = result.insertId;

          const photos = req.files.map((f) => [
            postId,
            `/uploads/${f.filename}`,
          ]);
          if (photos.length) {
            db.query(
              "INSERT INTO photos (post_id, image_url) VALUES ?",
              [photos],
              (err) => {
                if (err) {
                  console.error("Eroare la salvarea fotografiilor:", err);
                  return res
                    .status(500)
                    .json({ error: "Eroare la încărcarea fotografiilor" });
                }
                sendPost(postId, res);
              }
            );
          } else {
            sendPost(postId, res);
          }
        }
      );
    }
  );
});

function sendPost(postId, res) {
  db.query(
    `SELECT p.id, p.title, p.content, p.created_at,
            u.username,
            (SELECT COUNT(*) FROM likes WHERE post_id=p.id) AS likes
     FROM posts p
     JOIN users u ON u.id=p.user_id
     WHERE p.id = ?`,
    [postId],
    (e, rows) => {
      if (e) {
        console.error("Eroare la obținerea postării:", e);
        return res.status(500).json({ error: "Eroare la obținerea postării" });
      }
      if (rows.length === 0) {
        return res.status(404).json({ error: "Postarea nu a fost găsită" });
      }
      const post = rows[0];
      db.query(
        "SELECT * FROM photos WHERE post_id = ?",
        [postId],
        (errP, photos) => {
          if (errP) {
            console.error("Eroare la obținerea fotografiilor:", errP);
            return res
              .status(500)
              .json({ error: "Eroare la obținerea fotografiilor" });
          }
          db.query(
            `SELECT c.id, c.content, c.created_at, u.username 
             FROM comments c 
             JOIN users u ON u.id=c.user_id 
             WHERE c.post_id = ?`,
            [postId],
            (errC, comments) => {
              if (errC) {
                console.error("Eroare la obținerea comentariilor:", errC);
                return res
                  .status(500)
                  .json({ error: "Eroare la obținerea comentariilor" });
              }
              post.photos = photos;
              post.comments = comments;
              res.json(post);
            }
          );
        }
      );
    }
  );
}

// Updated GET /forum and /forum/:county routes with destination_id filtering
app.get(["/forum", "/forum/:county"], (req, res) => {
  const slug = req.params.county;
  const userId = Number(req.query.user_id) || 0;

  const baseQuery = `
    SELECT
      p.id,
      p.title,
      p.content,
      p.created_at,
      u.username,
      (SELECT COUNT(*) FROM likes WHERE post_id = p.id) AS likes,
      (SELECT COUNT(*) FROM likes WHERE post_id = p.id AND user_id = ?) AS liked_by_me
    FROM posts p
    JOIN users u ON u.id = p.user_id
  `;

  function attachComments(posts) {
    if (!posts.length) return res.json(posts);
    const ids = posts.map((p) => p.id);
    db.query(
      `SELECT c.*, u.username
         FROM comments c
         JOIN users u ON u.id = c.user_id
        WHERE c.post_id IN (?)
        ORDER BY c.created_at`,
      [ids],
      (errC, comments) => {
        if (errC) return res.status(500).json({ error: errC.sqlMessage });
        const byPost = {};
        comments.forEach((c) => {
          byPost[c.post_id] = byPost[c.post_id] || [];
          byPost[c.post_id].push(c);
        });
        const withComments = posts.map((p) => ({
          ...p,
          comments: byPost[p.id] || [],
        }));
        res.json(withComments);
      }
    );
  }

  if (slug) {
    db.query(
      "SELECT id FROM destinations WHERE slug = ?",
      [slug],
      (errD, destRows) => {
        if (errD) return res.status(500).json({ error: errD.sqlMessage });
        if (!destRows.length)
          return res.status(404).json({ error: "Județ inexistent" });

        const destination_id = destRows[0].id;
        const sql =
          baseQuery +
          `
          WHERE p.destination_id = ?
          ORDER BY p.created_at DESC`;

        db.query(sql, [userId, destination_id], (errP, posts) => {
          if (errP) return res.status(500).json({ error: errP.sqlMessage });
          attachComments(posts);
        });
      }
    );
  } else {
    const sql = baseQuery + ` ORDER BY p.created_at DESC`;
    db.query(sql, [userId], (err, posts) => {
      if (err) return res.status(500).json({ error: err.sqlMessage });
      attachComments(posts);
    });
  }
});
// Corectare rută POST /posts/:id/comments
app.post("/posts/:id/comments", (req, res) => {
  const postId = +req.params.id;
  const { user_id, content } = req.body;

  if (!user_id || !content) {
    return res.status(400).json({ error: "User ID and content are required" });
  }

  db.query(
    "INSERT INTO comments (post_id, user_id, content) VALUES (?, ?, ?)",
    [postId, user_id, content],
    (err, result) => {
      if (err) {
        console.error("Error adding comment:", err);
        return res.status(500).json({ error: "Database error" });
      }

      db.query(
        `SELECT c.id, c.content, c.created_at, u.username 
         FROM comments c JOIN users u ON u.id = c.user_id 
         WHERE c.id = ?`,
        [result.insertId],
        (err, rows) => {
          if (err || rows.length === 0) {
            return res.status(500).json({ error: "Failed to fetch comment" });
          }
          res.json(rows[0]);
        }
      );
    }
  );
});
// Like/unlike
app.post("/posts/:id/like", (req, res) => {
  const postId = Number(req.params.id);
  const user_id = req.body.user_id;

  console.log("Like request:", { postId, user_id });

  if (!user_id) {
    return res.status(400).json({ error: "Missing user_id" });
  }

  db.query(
    "INSERT IGNORE INTO likes (post_id, user_id) VALUES (?, ?)",
    [postId, user_id],
    (insertErr, insertResult) => {
      if (insertErr) {
        console.error(" Insert error:", insertErr);
        return res.status(500).json({ error: insertErr.sqlMessage });
      }

      if (insertResult.affectedRows === 1) {
        console.log(" Like added");
        return res.json({ post_id: postId, user_id, liked: true });
      }

      db.query(
        "DELETE FROM likes WHERE post_id = ? AND user_id = ?",
        [postId, user_id],
        (delErr) => {
          if (delErr) {
            console.error(" Delete error:", delErr);
            return res.status(500).json({ error: delErr.sqlMessage });
          }
          console.log(" Like removed");
          res.json({ post_id: postId, user_id, liked: false });
        }
      );
    }
  );
});

// GET /api/destinations
app.get("/api/destinations", (req, res) => {
  db.query("SELECT id, slug, name FROM destinations", (err, rows) => {
    if (err) return res.status(500).json({ error: err.sqlMessage });
    res.json(rows);
  });
});

app.listen(3001, () => console.log("API running on http://localhost:3001"));
