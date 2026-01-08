"use client";
import React, { useState, useEffect } from "react";
import { 
  Users, 
  Zap, 
  Shield, 
  ArrowRight, 
  Eye, 
  EyeOff, 
  Sparkles,
  Layers,
  MousePointer2,
  Share2,
  PenTool,
  Palette
} from "lucide-react";
import { HTTP_BACKEND } from "../config";
import { useRouter } from "next/navigation";
import { tokenManager } from "@/utils/tokenManager";

type AuthMode = "landing" | "signin" | "signup";
type AppState = "landing" | "authenticated" | "initializing";
type RoomMode = "create" | "join";

function App() {
  const router = useRouter();
  const [appState, setAppState] = useState<AppState>("initializing");
  const [authMode, setAuthMode] = useState<AuthMode>("landing");
  const [roomMode, setRoomMode] = useState<RoomMode>("create");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    name: "",
  });
  const [roomData, setRoomData] = useState({
    roomId: "",
    roomName: "",
    userName: "",
    createRoomName: "",
  });

  // Check for existing token on component mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        if (tokenManager.hasValidToken()) {
          const isValid = await tokenManager.validateToken();
          if (isValid) {
            setAppState("authenticated");
          } else {
            tokenManager.clearToken();
            setAppState("landing");
          }
        } else {
          setAppState("landing");
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
        setAppState("landing");
      }
    };

    initializeAuth();
  }, []);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (error) setError("");
  };

  const handleRoomInputChange = (field: string, value: string) => {
    setRoomData((prev) => ({ ...prev, [field]: value }));
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      if (authMode === "signup") {
        if (formData.password !== formData.confirmPassword) {
          setError("Passwords do not match");
          setIsLoading(false);
          return;
        }

        const signupResponse = await fetch(`${HTTP_BACKEND}/user/signup`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formData.name,
            email: formData.email,
            password: formData.password,
          }),
        });

        const signupData = await signupResponse.json();

        if (!signupResponse.ok) {
          throw new Error(signupData.message || "Failed to create account");
        }

        // Auto-login after signup if token returned
        if (signupData.token) {
          tokenManager.setToken(signupData.token);
          setAppState("authenticated");
        } else {
          // Fallback to signin
          const signinResponse = await fetch(`${HTTP_BACKEND}/user/signin`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: formData.email,
              password: formData.password,
            }),
          });

          const signinData = await signinResponse.json();
          if (!signinResponse.ok) {
            throw new Error(signinData.message || "Failed to sign in");
          }

          tokenManager.setToken(signinData.token);
          setAppState("authenticated");
        }
      } else {
        const response = await fetch(`${HTTP_BACKEND}/user/signin`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: formData.email,
            password: formData.password,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Failed to sign in");
        }

        tokenManager.setToken(data.token);
        setAppState("authenticated");
      }
    } catch (error) {
      console.error("Authentication error:", error);
      setError(
        error instanceof Error
          ? error.message
          : "An error occurred during authentication"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const validateResponse = await fetch(
        `${HTTP_BACKEND}/room/validate-room`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            roomId: roomData.roomId,
            roomName: roomData.roomName,
          }),
        }
      );

      const validationData = await validateResponse.json();

      if (!validateResponse.ok) {
        setError(validationData.message || "Failed to validate room");
        setIsLoading(false);
        return;
      }

      router.push(`/canvas/${roomData.roomId}`);
    } catch (error) {
      console.error("Join room error:", error);
      setError("Failed to join room");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const token = tokenManager.getToken();
      if (!token) {
        setError("Please sign in to create a room");
        setIsLoading(false);
        return;
      }

      if (!roomData.createRoomName.trim()) {
        setError("Please enter a room name");
        setIsLoading(false);
        return;
      }

      const response = await fetch(`${HTTP_BACKEND}/room`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          slug: roomData.createRoomName.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to create room");
      }

      router.push(`/canvas/${data.room.id}`);
    } catch (error) {
      console.error("Create room error:", error);
      setError(
        error instanceof Error ? error.message : "Failed to create room"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    tokenManager.clearToken();
    setAppState("landing");
    setAuthMode("landing");
    setFormData({ email: "", password: "", confirmPassword: "", name: "" });
    setRoomData({ roomId: "", roomName: "", userName: "", createRoomName: "" });
  };

  const resetToLanding = () => {
    setAuthMode("landing");
    setFormData({ email: "", password: "", confirmPassword: "", name: "" });
  };

  const handleGetStarted = () => {
    if (tokenManager.hasValidToken()) {
      setAppState("authenticated");
    } else {
      setAuthMode("signup");
    }
  };

  // Loading State
  if (appState === "initializing") {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 rounded-full border-4 border-purple-500/20"></div>
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-purple-500 animate-spin"></div>
          </div>
          <p className="text-gray-400 animate-pulse">Loading...</p>
        </div>
      </div>
    );
  }

  // Authenticated - Room Selection
  if (appState === "authenticated") {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-4">
        {/* Animated background */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>

        <div className="w-full max-w-md relative z-10">
          <div className="bg-[#12121a]/80 backdrop-blur-xl rounded-3xl border border-white/10 p-8 shadow-2xl">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-500 rounded-2xl mb-4 shadow-lg shadow-purple-500/25">
                <Layers className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">
                Welcome Back!
              </h2>
              <p className="text-gray-400">
                Create or join a collaborative canvas
              </p>
            </div>

            {/* Tab Selection */}
            <div className="flex gap-2 mb-6 bg-black/30 p-1.5 rounded-xl">
              <button
                onClick={() => setRoomMode("create")}
                className={`flex-1 py-2.5 px-4 rounded-lg font-medium transition-all duration-300 ${
                  roomMode === "create"
                    ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                Create Room
              </button>
              <button
                onClick={() => setRoomMode("join")}
                className={`flex-1 py-2.5 px-4 rounded-lg font-medium transition-all duration-300 ${
                  roomMode === "join"
                    ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                Join Room
              </button>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            {roomMode === "create" ? (
              <form onSubmit={handleCreateRoom} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Room Name
                  </label>
                  <input
                    type="text"
                    value={roomData.createRoomName}
                    onChange={(e) =>
                      handleRoomInputChange("createRoomName", e.target.value)
                    }
                    className="w-full px-4 py-3.5 bg-black/30 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent transition-all"
                    placeholder="Enter a unique room name"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 px-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-semibold hover:from-emerald-600 hover:to-teal-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transform hover:scale-[1.02] transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/25"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      Create New Room
                    </>
                  )}
                </button>
              </form>
            ) : (
              <form onSubmit={handleJoinRoom} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Room ID
                  </label>
                  <input
                    type="text"
                    value={roomData.roomId}
                    onChange={(e) =>
                      handleRoomInputChange("roomId", e.target.value)
                    }
                    className="w-full px-4 py-3.5 bg-black/30 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent transition-all"
                    placeholder="Enter room ID"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Room Name
                  </label>
                  <input
                    type="text"
                    value={roomData.roomName}
                    onChange={(e) =>
                      handleRoomInputChange("roomName", e.target.value)
                    }
                    className="w-full px-4 py-3.5 bg-black/30 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent transition-all"
                    placeholder="Enter room name"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 px-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transform hover:scale-[1.02] transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-500/25"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <>
                      Join Room
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </form>
            )}

            <div className="mt-6 pt-6 border-t border-white/10 flex gap-3">
              <button
                onClick={() => setAppState("landing")}
                className="flex-1 text-gray-400 hover:text-white text-sm font-medium transition-colors py-2"
              >
                ← Back to Home
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 text-red-400 hover:text-red-300 text-sm font-medium transition-colors py-2"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Landing Page
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-purple-500/20 rounded-full blur-[128px] animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-blue-500/20 rounded-full blur-[128px] animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-500/10 rounded-full blur-[128px]"></div>
      </div>

      {authMode === "landing" ? (
        <div className="relative z-10">
          {/* Header */}
          <header className="px-6 py-4">
            <nav className="max-w-7xl mx-auto flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 via-purple-600 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/30">
                    <Zap className="w-5 h-5 text-white" />
                  </div>
                  <div className="absolute -inset-1 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl blur opacity-30"></div>
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                  Excalidraw
                </span>
              </div>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setAuthMode("signin")}
                  className="px-5 py-2.5 text-gray-300 hover:text-white font-medium transition-colors"
                >
                  Sign In
                </button>
                <button
                  onClick={handleGetStarted}
                  className="px-5 py-2.5 bg-white text-gray-900 rounded-xl font-semibold hover:bg-gray-100 transform hover:scale-105 transition-all duration-300 shadow-lg"
                >
                  Get Started
                </button>
              </div>
            </nav>
          </header>

          {/* Hero Section */}
          <section className="px-6 pt-20 pb-32">
            <div className="max-w-5xl mx-auto text-center">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full mb-8 backdrop-blur-sm">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <span className="text-sm text-gray-300">Real-time collaborative drawing</span>
              </div>

              {/* Main Heading */}
              <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight tracking-tight">
                <span className="text-white">Where ideas</span>
                <br />
                <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
                  come to life
                </span>
              </h1>

              {/* Subheading */}
              <p className="text-xl text-gray-400 mb-12 max-w-2xl mx-auto leading-relaxed">
                Create stunning diagrams, wireframes, and illustrations with your team in real-time. 
                Simple, intuitive, and endlessly powerful.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={handleGetStarted}
                  className="group px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-2xl font-semibold text-lg hover:from-purple-500 hover:to-blue-500 transform hover:scale-105 transition-all duration-300 flex items-center justify-center gap-3 shadow-2xl shadow-purple-500/30"
                >
                  Start Creating Free
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
                <button
                  onClick={() => setAuthMode("signin")}
                  className="px-8 py-4 bg-white/5 border border-white/10 text-white rounded-2xl font-semibold text-lg hover:bg-white/10 hover:border-white/20 transition-all duration-300 backdrop-blur-sm"
                >
                  Sign In to Continue
                </button>
              </div>

              {/* Stats */}
              <div className="flex flex-wrap justify-center gap-8 mt-16">
                <div className="text-center">
                  <div className="text-3xl font-bold text-white">10K+</div>
                  <div className="text-sm text-gray-500">Active Users</div>
                </div>
                <div className="w-px h-12 bg-white/10 hidden sm:block"></div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-white">50K+</div>
                  <div className="text-sm text-gray-500">Drawings Created</div>
                </div>
                <div className="w-px h-12 bg-white/10 hidden sm:block"></div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-white">99.9%</div>
                  <div className="text-sm text-gray-500">Uptime</div>
                </div>
              </div>
            </div>
          </section>

          {/* Features Section */}
          <section className="px-6 py-24 relative">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-16">
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                  Everything you need to create
                </h2>
                <p className="text-gray-400 max-w-2xl mx-auto">
                  Powerful features that make collaboration seamless
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                {/* Feature 1 */}
                <div className="group p-8 bg-gradient-to-b from-white/5 to-transparent border border-white/10 rounded-3xl hover:border-purple-500/30 transition-all duration-500">
                  <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-purple-500/30">
                    <Users className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-3">
                    Real-time Collaboration
                  </h3>
                  <p className="text-gray-400 leading-relaxed">
                    Work together with your team in real-time. See changes instantly as others draw.
                  </p>
                </div>

                {/* Feature 2 */}
                <div className="group p-8 bg-gradient-to-b from-white/5 to-transparent border border-white/10 rounded-3xl hover:border-blue-500/30 transition-all duration-500">
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-blue-500/30">
                    <PenTool className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-3">
                    Intuitive Drawing Tools
                  </h3>
                  <p className="text-gray-400 leading-relaxed">
                    Shapes, arrows, freehand drawing, and more. Everything you need at your fingertips.
                  </p>
                </div>

                {/* Feature 3 */}
                <div className="group p-8 bg-gradient-to-b from-white/5 to-transparent border border-white/10 rounded-3xl hover:border-emerald-500/30 transition-all duration-500">
                  <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-emerald-500/30">
                    <Share2 className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-3">
                    Easy Export & Share
                  </h3>
                  <p className="text-gray-400 leading-relaxed">
                    Export to PNG, SVG, or copy to clipboard. Share your creations instantly.
                  </p>
                </div>

                {/* Feature 4 */}
                <div className="group p-8 bg-gradient-to-b from-white/5 to-transparent border border-white/10 rounded-3xl hover:border-pink-500/30 transition-all duration-500">
                  <div className="w-14 h-14 bg-gradient-to-br from-pink-500 to-pink-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-pink-500/30">
                    <Palette className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-3">
                    Custom Colors & Styles
                  </h3>
                  <p className="text-gray-400 leading-relaxed">
                    Choose from preset colors or use your own. Customize stroke width and more.
                  </p>
                </div>

                {/* Feature 5 */}
                <div className="group p-8 bg-gradient-to-b from-white/5 to-transparent border border-white/10 rounded-3xl hover:border-orange-500/30 transition-all duration-500">
                  <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-orange-500/30">
                    <MousePointer2 className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-3">
                    Keyboard Shortcuts
                  </h3>
                  <p className="text-gray-400 leading-relaxed">
                    Speed up your workflow with intuitive keyboard shortcuts for all tools.
                  </p>
                </div>

                {/* Feature 6 */}
                <div className="group p-8 bg-gradient-to-b from-white/5 to-transparent border border-white/10 rounded-3xl hover:border-cyan-500/30 transition-all duration-500">
                  <div className="w-14 h-14 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-cyan-500/30">
                    <Shield className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-3">
                    Secure & Private
                  </h3>
                  <p className="text-gray-400 leading-relaxed">
                    Your data is encrypted and secure. Full control over room access.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Footer CTA */}
          <section className="px-6 py-24">
            <div className="max-w-4xl mx-auto text-center">
              <div className="bg-gradient-to-r from-purple-500/10 via-blue-500/10 to-purple-500/10 border border-white/10 rounded-3xl p-12 backdrop-blur-sm">
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                  Ready to start creating?
                </h2>
                <p className="text-gray-400 mb-8 max-w-xl mx-auto">
                  Join thousands of teams using Excalidraw to bring their ideas to life.
                </p>
                <button
                  onClick={handleGetStarted}
                  className="px-8 py-4 bg-white text-gray-900 rounded-2xl font-semibold text-lg hover:bg-gray-100 transform hover:scale-105 transition-all duration-300 shadow-2xl"
                >
                  Get Started — It&apos;s Free
                </button>
              </div>
            </div>
          </section>

          {/* Footer */}
          <footer className="px-6 py-8 border-t border-white/5">
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg flex items-center justify-center">
                  <Zap className="w-4 h-4 text-white" />
                </div>
                <span className="text-gray-400 text-sm">
                  © 2024 Excalidraw. All rights reserved.
                </span>
              </div>
              <div className="text-gray-500 text-sm">
                Built with ❤️ for creators
              </div>
            </div>
          </footer>
        </div>
      ) : (
        // Auth Forms
        <div className="min-h-screen flex items-center justify-center p-4 relative z-10">
          <div className="w-full max-w-md">
            <div className="bg-[#12121a]/80 backdrop-blur-xl rounded-3xl border border-white/10 p-8 shadow-2xl">
              <div className="text-center mb-8">
                <button
                  onClick={resetToLanding}
                  className="inline-flex items-center gap-2 text-gray-400 hover:text-white text-sm font-medium mb-6 transition-colors"
                >
                  ← Back to Home
                </button>
                <h2 className="text-2xl font-bold text-white mb-2">
                  {authMode === "signin" ? "Welcome Back" : "Create Account"}
                </h2>
                <p className="text-gray-400">
                  {authMode === "signin"
                    ? "Sign in to continue to your canvas"
                    : "Get started with your free account"}
                </p>
              </div>

              {error && (
                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              <form onSubmit={handleAuth} className="space-y-5">
                {authMode === "signup" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleInputChange("name", e.target.value)}
                      className="w-full px-4 py-3.5 bg-black/30 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent transition-all"
                      placeholder="Enter your full name"
                      required
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    className="w-full px-4 py-3.5 bg-black/30 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent transition-all"
                    placeholder="Enter your email"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) =>
                        handleInputChange("password", e.target.value)
                      }
                      className="w-full px-4 py-3.5 pr-12 bg-black/30 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent transition-all"
                      placeholder="Enter your password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>

                {authMode === "signup" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Confirm Password
                    </label>
                    <input
                      type="password"
                      value={formData.confirmPassword}
                      onChange={(e) =>
                        handleInputChange("confirmPassword", e.target.value)
                      }
                      className="w-full px-4 py-3.5 bg-black/30 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent transition-all"
                      placeholder="Confirm your password"
                      required
                    />
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 px-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-semibold hover:from-purple-500 hover:to-blue-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transform hover:scale-[1.02] transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-500/25"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <>
                      {authMode === "signin" ? "Sign In" : "Create Account"}
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              <div className="mt-6 pt-6 border-t border-white/10 text-center">
                <p className="text-gray-400 text-sm">
                  {authMode === "signin"
                    ? "Don't have an account? "
                    : "Already have an account? "}
                  <button
                    onClick={() =>
                      setAuthMode(authMode === "signin" ? "signup" : "signin")
                    }
                    className="text-purple-400 hover:text-purple-300 font-medium transition-colors"
                  >
                    {authMode === "signin" ? "Sign up" : "Sign in"}
                  </button>
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
