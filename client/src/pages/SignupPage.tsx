"use client"

import { Link, Navigate, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Mail, Lock, Eye, EyeOff, User } from "lucide-react"
import { useState } from "react"
import { Helmet } from "react-helmet-async";
import { useAuth } from "@/hooks/useAuth"
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
 

  const navigate = useNavigate();
  const queryClient = useQueryClient()

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

      const res = await fetch(`/api/auth/signup`, {
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
         // Role-based navigation
         if (data.user.role === "admin") {
          navigate("/dashboard");
        } else if (data.user.role === "maintenance") {
          navigate("/assigned-requests");
        } else {
          navigate("/dashboard"); // requester or default
        }
        
        // navigate("/login");
      }
    } catch (err: any) {
      console.error("Network/Unexpected Error:", err);
      setError("Signup failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
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
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden max-w-5xl w-full flex">
        {/* Left Panel - Signup Form */}
        <div className="w-full lg:w-1/2 p-8 lg:p-12">
          {/* Logo */}
          <div className="flex items-center gap-2 mb-8">
            <img src={logoPath} alt="RepairRequest" className="w-10 h-10" />
            <span className="text-lg font-semibold text-gray-900">Repair Request</span>
          </div>

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Create your Account</h1>
            <p className="text-gray-600 text-sm">Welcome! Please fill in the details to get started.</p>
          </div>

          {/* Social Login Buttons */}
          <div className="flex gap-3 mb-6">
            <Button
              variant="outline"
              className="flex-1 h-12 border-gray-200 hover:bg-gray-50 flex items-center justify-center gap-2 bg-transparent"
              onClick={() => {
                window.location.href = `/api/auth/google`;
              }}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Sign Up with Google
            </Button>
            {/* <Button
              variant="outline"
              className="flex-1 h-12 border-gray-200 hover:bg-gray-50 flex items-center justify-center gap-2 bg-transparent"
            >
              <svg width="20" height="20" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                <rect width="50" height="50" x="0" y="0" fill="#F25022" />
                <rect width="50" height="50" x="50" y="0" fill="#7FBA00" />
                <rect width="50" height="50" x="0" y="50" fill="#00A4EF" />
                <rect width="50" height="50" x="50" y="50" fill="#FFB900" />
              </svg>
              Microsoft
            </Button> */}
          </div>

          {/* Divider */}
          <div className="relative flex items-center mb-6">
            <div className="flex-grow border-t border-gray-200"></div>
            <span className="flex-shrink mx-4 text-gray-500 text-sm">or continue with email</span>
            <div className="flex-grow border-t border-gray-200"></div>
          </div>

          {/* Error/Success Messages */}
          {error && <div className="mb-4 text-red-600 text-sm">{error}</div>}
          {success && <div className="mb-4 text-green-600 text-sm">{success}</div>}

          {/* Form Fields */}
          <form className="space-y-4 mb-6" onSubmit={handleSubmit}>
            {/* Full Name */}
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                type="text"
                placeholder="Full Name"
                className="pl-10 h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                autoComplete="name"
              />
            </div>

            {/* Email Input */}
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                type="email"
                placeholder="Email"
                className="pl-10 h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                value={email}
                onChange={e => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>

            {/* Password Input */}
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                className="pl-10 pr-10 h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            {/* Confirm Password Input */}
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm Password"
                className="pl-10 pr-10 h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                tabIndex={-1}
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            {/* Terms & Conditions */}
            <div className="flex items-start space-x-2 mb-6">
              <Checkbox id="terms" className="border-gray-300 mt-1" />
              <Label htmlFor="terms" className="text-sm text-gray-600 leading-relaxed">
                I agree to the{" "}
                <Link to="/terms" className="text-blue-600 hover:text-blue-700">
                  Terms & Conditions
                </Link>{" "}
                and{" "}
                <Link to="/privacy" className="text-blue-600 hover:text-blue-700">
                  Privacy Policy
                </Link>
              </Label>
            </div>

            {/* Create Account Button */}
            <Button className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-medium mb-6" type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Account"}
            </Button>
          </form>

          {/* Sign In Link */}
          <div className="text-center text-sm text-gray-600">
            Already have an account?{" "}
            <Link to="/login" className="text-blue-600 hover:text-blue-700 font-medium">
              Sign in
            </Link>
          </div>
        </div>

        {/* Right Panel - Illustration */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 to-blue-700 relative overflow-hidden">
          <div className="absolute inset-0 bg-blue-600"></div>

          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-20 left-20 w-32 h-32 rounded-full bg-white"></div>
            <div className="absolute bottom-20 right-20 w-24 h-24 rounded-full bg-white"></div>
            <div className="absolute top-1/2 left-10 w-16 h-16 rounded-full bg-white"></div>
          </div>

          <div className="relative z-10 flex flex-col justify-center items-start text-white px-16 py-20 text-left w-full h-full">
            <h1 className="text-4xl font-extrabold leading-tight mb-4 max-w-md">
              Built for Service Teams.
            </h1>
            <p className="text-blue-100 text-lg leading-relaxed max-w-md">
              Manage repair requests, schedules, and reports in one unified dashboard, no more manual chaos.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}