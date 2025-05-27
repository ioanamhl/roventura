const AuthService = {
  login: async (email, password) => {
    try {
      const res = await fetch("http://localhost:5000/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) return null;
      const data = await res.json();
      return data.token;
    } catch (err) {
      console.error(err);
      return null;
    }
  },
  register: async (email, password) => {
    try {
      const res = await fetch("http://localhost:5000/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) return null;
      const data = await res.json();
      return data.token;
    } catch (err) {
      console.error(err);
      return null;
    }
  },
};

export default AuthService;
