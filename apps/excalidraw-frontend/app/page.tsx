"use client";
import React, { useState, useEffect } from "react";
import { Users, Zap, Shield, ArrowRight, Eye, EyeOff } from "lucide-react";
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
				// Check if there's a valid token
				if (tokenManager.hasValidToken()) {
					// Validate with backend to ensure token is still active
					const isValid = await tokenManager.validateToken();

					if (isValid) {
						setAppState("authenticated");
					} else {
						// Token validation failed, clear and reset
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
				// Validate password confirmation
				if (formData.password !== formData.confirmPassword) {
					setError("Passwords do not match");
					setIsLoading(false);
					return;
				}

				// Sign up API call
				const signupResponse = await fetch(`${HTTP_BACKEND}/user/signup`, {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						name: formData.name,
						email: formData.email,
						password: formData.password,
					}),
				});

				const signupData = await signupResponse.json();

				if (!signupResponse.ok) {
					throw new Error(
						signupData.message || "Failed to create account"
					);
				}

				// After successful signup, automatically sign in
				const signinResponse = await fetch(`${HTTP_BACKEND}/user/signin`, {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						email: formData.email,
						password: formData.password,
					}),
				});

				const signinData = await signinResponse.json();

				if (!signinResponse.ok) {
					throw new Error(signinData.message || "Failed to sign in");
				}

				// Use tokenManager to securely store token
				tokenManager.setToken(signinData.token);
				setAppState("authenticated");
			} else {
				// Sign in API call
				const response = await fetch(`${HTTP_BACKEND}/user/signin`, {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						email: formData.email,
						password: formData.password,
					}),
				});

				const data = await response.json();

				if (!response.ok) {
					throw new Error(data.message || "Failed to sign in");
				}

				// Use tokenManager to securely store token
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
			// Validate that both room ID and room name match
			const validateResponse = await fetch(
				`${HTTP_BACKEND}/room/validate-room`,
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
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

			// If validation successful, navigate to the canvas page with the room ID
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

			// Navigate to the new room using the room ID
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
		setRoomData({
			roomId: "",
			roomName: "",
			userName: "",
			createRoomName: "",
		});
	};

	const resetToLanding = () => {
		setAuthMode("landing");
		setFormData({ email: "", password: "", confirmPassword: "", name: "" });
	};

	const handleGetStarted = () => {
		// Check if user already has a valid token
		if (tokenManager.hasValidToken()) {
			// Automatically authenticate if token exists
			setAppState("authenticated");
		} else {
			// Otherwise, go to signup page
			setAuthMode("signup");
		}
	};

	if (appState === "initializing") {
		return (
			<div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
				<div className="text-center">
					<div className="inline-flex items-center justify-center mb-4">
						<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
					</div>
					<p className="text-gray-600 font-medium">Loading...</p>
				</div>
			</div>
		);
	}

	if (appState === "authenticated") {
		return (
			<div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
				<div className="w-full max-w-md">
					<div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
						<div className="text-center mb-8">
							<div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
								<Users className="w-8 h-8 text-blue-600" />
							</div>
							<h2 className="text-2xl font-bold text-gray-900 mb-2">
								Welcome Back!
							</h2>
							<p className="text-gray-600">
								Create a room with a custom name or join an existing one
							</p>
						</div>

						{/* Tab Selection */}
						<div className="flex gap-2 mb-6 bg-gray-100 p-1 rounded-lg">
							<button
								onClick={() => setRoomMode("create")}
								className={`flex-1 py-2 px-4 rounded-md font-medium transition-all duration-200 ${
									roomMode === "create"
										? "bg-white text-gray-900 shadow-sm"
										: "text-gray-600 hover:text-gray-900"
								}`}
							>
								Create Room
							</button>
							<button
								onClick={() => setRoomMode("join")}
								className={`flex-1 py-2 px-4 rounded-md font-medium transition-all duration-200 ${
									roomMode === "join"
										? "bg-white text-gray-900 shadow-sm"
										: "text-gray-600 hover:text-gray-900"
								}`}
							>
								Join Room
							</button>
						</div>

						{error && (
							<div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
								<p className="text-red-600 text-sm">{error}</p>
							</div>
						)}

						{roomMode === "create" ? (
							// Create Room Form
							<form onSubmit={handleCreateRoom} className="space-y-6">
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-2">
										Room Name
									</label>
									<input
										type="text"
										value={roomData.createRoomName}
										onChange={(e) =>
											handleRoomInputChange(
												"createRoomName",
												e.target.value
											)
										}
										className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 text-gray-900"
										placeholder="Enter room name"
										required
									/>
								</div>
								<button
									type="submit"
									disabled={isLoading}
									className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white py-3 px-4 rounded-lg font-medium hover:from-green-700 hover:to-green-800 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transform hover:scale-105 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
								>
									{isLoading ? "Creating..." : "Create New Room"}
									<Zap className="w-4 h-4" />
								</button>
							</form>
						) : (
							// Join Room Form
							<form onSubmit={handleJoinRoom} className="space-y-6">
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-2">
										Room ID
									</label>
									<input
										type="text"
										value={roomData.roomId}
										onChange={(e) =>
											handleRoomInputChange("roomId", e.target.value)
										}
										className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900"
										placeholder="Enter room ID"
										required
									/>
								</div>
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-2">
										Room Name
									</label>
									<input
										type="text"
										value={roomData.roomName}
										onChange={(e) =>
											handleRoomInputChange(
												"roomName",
												e.target.value
											)
										}
										className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900"
										placeholder="Enter room name"
										required
									/>
								</div>
								<button
									type="submit"
									disabled={isLoading}
									className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transform hover:scale-105 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
								>
									{isLoading ? "Joining..." : "Join Room"}
									<ArrowRight className="w-4 h-4" />
								</button>
							</form>
						)}

						<div className="mt-6 pt-6 border-t border-gray-200 flex gap-3">
							<button
								onClick={() => setAppState("landing")}
								className="flex-1 text-gray-600 hover:text-gray-800 text-sm font-medium transition-colors duration-200"
							>
								← Back to Home
							</button>
							<button
								onClick={handleLogout}
								className="flex-1 text-red-600 hover:text-red-800 text-sm font-medium transition-colors duration-200"
							>
								Sign Out
							</button>
						</div>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
			{authMode === "landing" ? (
				// Landing Page
				<div className="relative">
					{/* Header */}
					<header className="relative z-10 px-4 py-6">
						<nav className="max-w-7xl mx-auto flex items-center justify-between">
							<div className="flex items-center gap-2">
								<div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
									<Zap className="w-5 h-5 text-white" />
								</div>
								<span className="text-xl font-bold text-gray-900">
									Excalidraw
								</span>
							</div>
							<div className="flex items-center gap-3">
								<button
									onClick={() => setAuthMode("signin")}
									className="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium transition-colors duration-200"
								>
									Sign In
								</button>
								<button
									onClick={handleGetStarted}
									className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transform hover:scale-105 transition-all duration-200"
								>
									Get Started
								</button>
							</div>
						</nav>
					</header>

					{/* Hero Section */}
					<section className="px-4 py-20">
						<div className="max-w-4xl mx-auto text-center">
							<h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
								Collaborative
								<span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
									{" "}
									Whiteboard{" "}
								</span>
								for Teams
							</h1>
							<p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed">
								Create, collaborate, and bring your ideas to life with
								our powerful online whiteboard. Perfect for
								brainstorming, planning, and visual collaboration.
							</p>
							<div className="flex flex-col sm:flex-row gap-4 justify-center">
								<button
									onClick={handleGetStarted}
									className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transform hover:scale-105 transition-all duration-200 flex items-center justify-center gap-2"
								>
									Start Creating
									<ArrowRight className="w-5 h-5" />
								</button>
								<button
									onClick={() => setAuthMode("signin")}
									className="px-8 py-4 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:border-gray-400 hover:text-gray-900 transition-all duration-200"
								>
									Sign In
								</button>
							</div>
						</div>
					</section>

					{/* Features */}
					<section className="px-4 py-20 bg-white/50 backdrop-blur-sm">
						<div className="max-w-6xl mx-auto">
							<h2 className="text-3xl font-bold text-center text-gray-900 mb-16">
								Why Choose Our Platform?
							</h2>
							<div className="grid md:grid-cols-3 gap-8">
								<div className="text-center p-6 rounded-2xl bg-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
									<div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-6">
										<Users className="w-8 h-8 text-blue-600" />
									</div>
									<h3 className="text-xl font-semibold text-gray-900 mb-4">
										Real-time Collaboration
									</h3>
									<p className="text-gray-600">
										Work together in real-time with your team members
										from anywhere in the world.
									</p>
								</div>
								<div className="text-center p-6 rounded-2xl bg-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
									<div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-6">
										<Zap className="w-8 h-8 text-purple-600" />
									</div>
									<h3 className="text-xl font-semibold text-gray-900 mb-4">
										Lightning Fast
									</h3>
									<p className="text-gray-600">
										Built for speed and performance. Your ideas flow
										as fast as you can think them.
									</p>
								</div>
								<div className="text-center p-6 rounded-2xl bg-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
									<div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-6">
										<Shield className="w-8 h-8 text-green-600" />
									</div>
									<h3 className="text-xl font-semibold text-gray-900 mb-4">
										Secure & Private
									</h3>
									<p className="text-gray-600">
										Your data is encrypted and secure. Full control
										over who can access your boards.
									</p>
								</div>
							</div>
						</div>
					</section>
				</div>
			) : (
				// Auth Forms
				<div className="min-h-screen flex items-center justify-center p-4">
					<div className="w-full max-w-md">
						<div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
							<div className="text-center mb-8">
								<button
									onClick={resetToLanding}
									className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-800 text-sm font-medium mb-6 transition-colors duration-200"
								>
									← Back to Home
								</button>
								<h2 className="text-2xl font-bold text-gray-900 mb-2">
									{authMode === "signin"
										? "Welcome Back"
										: "Create Account"}
								</h2>
								<p className="text-gray-600">
									{authMode === "signin"
										? "Sign in to your account to continue"
										: "Get started with your free account"}
								</p>
							</div>

							{error && (
								<div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
									<p className="text-red-600 text-sm">{error}</p>
								</div>
							)}

							<form onSubmit={handleAuth} className="space-y-6">
								{authMode === "signup" && (
									<div>
										<label className="block text-sm font-medium text-gray-700 mb-2">
											Full Name
										</label>
										<input
											type="text"
											value={formData.name}
											onChange={(e) =>
												handleInputChange("name", e.target.value)
											}
											className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900"
											placeholder="Enter your full name"
											required
										/>
									</div>
								)}

								<div>
									<label className="block text-sm font-medium text-gray-700 mb-2">
										Email Address
									</label>
									<input
										type="email"
										value={formData.email}
										onChange={(e) =>
											handleInputChange("email", e.target.value)
										}
										className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900"
										placeholder="Enter your email"
										required
									/>
								</div>

								<div>
									<label className="block text-sm font-medium text-gray-700 mb-2">
										Password
									</label>
									<div className="relative">
										<input
											type={showPassword ? "text" : "password"}
											value={formData.password}
											onChange={(e) =>
												handleInputChange(
													"password",
													e.target.value
												)
											}
											className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900"
											placeholder="Enter your password"
											required
										/>
										<button
											type="button"
											onClick={() => setShowPassword(!showPassword)}
											className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
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
										<label className="block text-sm font-medium text-gray-700 mb-2">
											Confirm Password
										</label>
										<input
											type="password"
											value={formData.confirmPassword}
											onChange={(e) =>
												handleInputChange(
													"confirmPassword",
													e.target.value
												)
											}
											className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900"
											placeholder="Confirm your password"
											required
										/>
									</div>
								)}

								<button
									type="submit"
									disabled={isLoading}
									className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transform hover:scale-105 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
								>
									{isLoading
										? "Please wait..."
										: authMode === "signin"
											? "Sign In"
											: "Create Account"}
									<ArrowRight className="w-4 h-4" />
								</button>
							</form>

							<div className="mt-6 pt-6 border-t border-gray-200 text-center">
								<p className="text-gray-600 text-sm">
									{authMode === "signin"
										? "Don't have an account? "
										: "Already have an account? "}
									<button
										onClick={() =>
											setAuthMode(
												authMode === "signin" ? "signup" : "signin"
											)
										}
										className="text-blue-600 hover:text-blue-800 font-medium transition-colors duration-200"
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
