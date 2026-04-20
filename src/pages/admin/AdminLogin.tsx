import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Lock } from "lucide-react";
import { setAdminPassword } from "@/stores/contentSync";

// SHA-256 hash of the admin password — plaintext is never in the bundle
const ADMIN_PASSWORD_HASH = "f0ac4193f9d135e927ebc75d01bad8f9e3c81443b59aa7680b75b587f25dec15";

async function sha256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

// Generate a session token that is not a simple boolean flag
async function generateSessionToken(password: string): Promise<string> {
  const timestamp = Date.now().toString();
  return sha256(password + timestamp + "admin-session-salt");
}

const AdminLogin: React.FC = () => {
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const hash = await sha256(password);
      if (hash === ADMIN_PASSWORD_HASH) {
        const token = await generateSessionToken(password);
        sessionStorage.setItem("admin-auth-token", token);
        // Cache plaintext for cloud writes (cleared on logout)
        setAdminPassword(password);
        navigate("/admin/dashboard");
      } else {
        setError(true);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto">
            <Lock className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Admin Panel</h1>
          <p className="text-sm text-muted-foreground">Al-Rahman Moschee</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError(false); }}
            className={error ? "border-destructive" : ""}
          />
          {error && <p className="text-sm text-destructive">Incorrect password</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Verifying…" : "Login"}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;
