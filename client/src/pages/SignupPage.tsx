"use client"

import { Link, useNavigate, useSearchParams } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Eye, EyeOff, Building2 } from "lucide-react"
import { useState } from "react"
import { Helmet } from "react-helmet-async";
import logoPath from "@assets/RepairRequest Logo Transparent_1750783382845.png";
import { useQueryClient } from "@tanstack/react-query"

export default function SignupPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const inviteToken = searchParams.get("invite");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!fullName || !email || !password || !confirmPassword) {
      setError("Please fill in all fields.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const nameParts = fullName.trim().split(" ").filter(part => part.length > 0);
      const firstName = nameParts[0] || "";
      const lastName = nameParts.slice(1).join(" ") || "";

      // Validate that we have both first and last name
      if (!firstName || !lastName) {
        setError("Please enter both first and last name.");
        setLoading(false);
        return;
      }

      const res = await fetch(`/api/auth/signup${inviteToken ? `?invite=${inviteToken}` : ""}`, {
        method: "POST",
        headers: { "Content-Type": "application/json"},
        body: JSON.stringify({ email, password, firstName, lastName }),
        credentials: "include" // send cookie with request
      });
      const data = await res.json();
      console.log("Server Response: ", data);

      console.log("SignUp data: ", res)
      if (!res.ok) {
        console.error("Signup Error:", data);
        setError(data.message || "Signup failed");
      } else {
        console.log("Signup successful");
        setSuccess("Signup successful! You can now log in.");
        setFullName("");
        setEmail("");
        setPassword("");
        setConfirmPassword("");

        await queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });

        // Invited users join an existing org — skip onboarding
        if (inviteToken) {
          navigate("/dashboard");
        } else {
          navigate("/onboarding");
        }
      }
    } catch (err: any) {
      console.error("Network/Unexpected Error:", err);
      setError("Signup failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4">
      <Helmet>
        <title>Sign Up - Create Your RepairRequest Account</title>
        <meta name="description" content="Create your free RepairRequest account to start managing maintenance requests, work orders, and facility operations. Sign up in seconds." />
        <link rel="canonical" href="https://www.repairrequest.org/signup" />
        <meta property="og:title" content="Sign Up for RepairRequest" />
        <meta property="og:description" content="Create your free account and start streamlining facility maintenance today." />
        <meta property="og:url" content="https://www.repairrequest.org/signup" />
        <meta name="twitter:title" content="Sign Up for RepairRequest" />
        <meta name="twitter:description" content="Create your free account for facilities management." />
      </Helmet>

      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <Link to="/" className="hover:opacity-80 transition-opacity">
            <div className="w-16 h-16 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center mb-5">
              <img src={logoPath} alt="RepairRequest Logo" className="w-10 h-10 object-contain" />
            </div>
          </Link>
          <h1 className="text-2xl font-semibold text-gray-900 mb-1">Get Started</h1>
          <p className="text-gray-500 text-sm">Choose how you want to explore RepairRequest</p>
        </div>

        {/* "Create my own account" card */}
        {!showForm ? (
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="w-full text-left border border-gray-200 rounded-xl p-4 hover:border-slate-400 hover:bg-gray-50 transition-colors mb-4 flex items-start gap-3 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2"
          >
            <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Building2 className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">Create my own account</p>
              <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                Set up your own organization, add buildings, and invite your team. Free to start.
              </p>
            </div>
          </button>
        ) : (
          <div className="border border-gray-200 rounded-xl p-5 mb-4">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                <Building2 className="w-4 h-4 text-blue-600" />
              </div>
              <p className="text-sm font-semibold text-gray-900">Create my own account</p>
            </div>

            {/* Error/Success Messages */}
            {error && <div className="mb-3 text-red-600 text-sm">{error}</div>}
            {success && <div className="mb-3 text-green-600 text-sm">{success}</div>}

            <form className="space-y-3" onSubmit={handleSubmit}>
              {/* Full Name */}
              <div>
                <Label htmlFor="fullName" className="text-sm font-medium text-gray-700 mb-1.5 block">
                  Full Name
                </Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Jane Smith"
                  className="h-11 border-gray-200 focus:border-slate-900 focus:ring-slate-900"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  autoComplete="name"
                />
              </div>

              {/* Email */}
              <div>
                <Label htmlFor="email" className="text-sm font-medium text-gray-700 mb-1.5 block">
                  Email address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  className="h-11 border-gray-200 focus:border-slate-900 focus:ring-slate-900"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  autoComplete="email"
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
                    placeholder="Create a password"
                    className="h-11 pr-10 border-gray-200 focus:border-slate-900 focus:ring-slate-900"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    autoComplete="new-password"
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

              {/* Confirm Password */}
              <div>
                <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700 mb-1.5 block">
                  Confirm Password
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm your password"
                    className="h-11 pr-10 border-gray-200 focus:border-slate-900 focus:ring-slate-900"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Terms & Conditions */}
              <div className="flex items-start space-x-2 pt-1">
                <Checkbox id="terms" className="border-gray-300 mt-0.5" />
                <Label htmlFor="terms" className="text-xs text-gray-500 leading-relaxed">
                  I agree to the{" "}
                  <Link to="/terms" className="text-slate-700 hover:text-slate-900 underline">
                    Terms & Conditions
                  </Link>{" "}
                  and{" "}
                  <Link to="/privacy" className="text-slate-700 hover:text-slate-900 underline">
                    Privacy Policy
                  </Link>
                </Label>
              </div>

              {/* Submit */}
              <Button
                className="w-full h-11 bg-slate-900 hover:bg-slate-800 text-white font-medium mt-1"
                type="submit"
                disabled={loading}
              >
                {loading ? "Creating account..." : "Create Account"}
              </Button>
            </form>
          </div>
        )}

        {/* Or divider */}
        <div className="relative flex items-center mb-4">
          <div className="flex-grow border-t border-gray-200"></div>
          <span className="flex-shrink mx-4 text-gray-400 text-xs">Or</span>
          <div className="flex-grow border-t border-gray-200"></div>
        </div>

        {/* Google Button */}
        <Button
          type="button"
          variant="outline"
          className="w-full h-11 border-gray-200 hover:bg-gray-50 flex items-center justify-center gap-2 bg-white text-gray-700 font-medium"
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

        {/* Sign In Link */}
        <p className="mt-6 text-center text-sm text-gray-500">
          Already have an account?{" "}
          <Link to="/login" className="text-slate-900 hover:text-slate-700 font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
