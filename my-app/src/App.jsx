import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Forum from "./pages/Forum";
import Navbar from "./components/Navbar";
import { useState } from "react";
import "./App.css";
import ForumJudet from "./pages/ForumJudet";

function App() {
  const [user, setUser] = useState(null);

  return (
    <Router>
      <Routes>
        <Route path="/"      element={<Home />} />
        <Route path="/login" element={<Login setUser={setUser} />} />
        <Route path="/signup"element={<Signup setUser={setUser} />} />

        <Route path="/forum" element={<Forum user={user} setUser={setUser} />}>
          <Route index      element={<ForumJudet user={user} />} />
          <Route path=":county" element={<ForumJudet user={user} />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
