"use client"
import { Link, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Eye, EyeOff } from "lucide-react"
import { useState } from "react"
import { Helmet } from "react-helmet-async";
import { queryClient } from "@/lib/queryClient";
import logoPath from "@assets/RepairRequest Logo Transparent_1750783382845.png";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const navigate = useNavigate()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password: password.trim(),
        }),
        credentials: "include", // Send cookies with request
      });

      const data = await res.json();
      console.log('response: ', data)
      if (!res.ok) {
        setError(data.message || "Login failed");
      } else {
        setSuccess("Login successful!");
        await queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
        // Role-based navigation
        if (data.user.role === "admin") {
          navigate("/dashboard");
        } else if (data.user.role === "maintenance") {
          navigate("/assigned-requests");
        } else {
          navigate("/dashboard"); // requester or default
        }
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4">
      <Helmet>
        <title>Login - RepairRequest Facilities Management Portal</title>
        <meta name="description" content="Log in to your RepairRequest account to manage maintenance requests, track work orders, and access your facilities management dashboard." />
        <link rel="canonical" href="https://www.repairrequest.org/login" />
        <meta property="og:title" content="Login to RepairRequest" />
        <meta property="og:description" content="Access your facilities management dashboard and maintenance tracking system." />
        <meta property="og:url" content="https://www.repairrequest.org/login" />
        <meta name="twitter:title" content="Login to RepairRequest" />
        <meta name="twitter:description" content="Access your facilities management dashboard." />
      </Helmet>

      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <Link to="/" className="hover:opacity-80 transition-opacity">
            <div className="w-16 h-16 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center mb-5">
              <img src={logoPath} alt="RepairRequest Logo" className="w-10 h-10 object-contain" />
            </div>
          </Link>
          <h1 className="text-2xl font-semibold text-gray-900 mb-1">Welcome back</h1>
          <p className="text-gray-500 text-sm">Sign in to your RepairRequest account</p>
        </div>

        {/* Google Button */}
        <Button
          type="button"
          variant="outline"
          className="w-full h-11 border-gray-200 hover:bg-gray-50 flex items-center justify-center gap-2 bg-white text-gray-700 font-medium mb-4"
          onClick={() => {
            window.location.href = `/api/auth/google`;
          }}
        >
          <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Continue with Google
        </Button>

        {/* Divider */}
        <div className="relative flex items-center mb-4">
          <div className="flex-grow border-t border-gray-200"></div>
          <span className="flex-shrink mx-4 text-gray-400 text-xs">Or continue with email</span>
          <div className="flex-grow border-t border-gray-200"></div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          {/* Email */}
          <div>
            <Label htmlFor="email" className="text-sm font-medium text-gray-700 mb-1.5 block">
              Email address
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              disabled={loading}
              autoComplete="email"
              className="h-11 border-gray-200 focus:border-slate-900 focus:ring-slate-900"
            />
          </div>

          {/* Password */}
          <div>
            <Label htmlFor="password" className="text-sm font-medium text-gray-700 mb-1.5 block">
              Password
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                disabled={loading}
                autoComplete="current-password"
                className="h-11 pr-10 border-gray-200 focus:border-slate-900 focus:ring-slate-900"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Forgot Password */}
          <div className="flex justify-end">
            <Link to="/forgot-password" className="text-sm text-slate-700 hover:text-slate-900">
              Forgot password?
            </Link>
          </div>

          {/* Error/Success Messages */}
          {error && <div className="text-red-600 text-sm">{error}</div>}
          {success && <div className="text-green-600 text-sm">{success}</div>}

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={loading}
            className="w-full h-11 bg-slate-900 hover:bg-slate-800 text-white font-medium"
          >
            {loading ? "Signing in..." : "Sign In"}
          </Button>
        </form>

        {/* Sign Up Link */}
        <p className="mt-6 text-center text-sm text-gray-500">
          Don't have an account?{" "}
          <Link to="/signup" className="text-slate-900 hover:text-slate-700 font-medium">
            Create one free
          </Link>
        </p>
      </div>
    </div>
  )
}
