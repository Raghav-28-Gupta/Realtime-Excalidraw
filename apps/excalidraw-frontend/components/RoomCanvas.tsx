"use client";
import { WS_URL, HTTP_BACKEND } from "@/config";
import { useEffect, useRef, useState } from "react";
import { Canvas } from "./Canvas";
import { useRouter } from "next/navigation";
import { Home, DoorOpen, X } from "lucide-react";
import { tokenManager } from "@/utils/tokenManager";

export function RoomCanvas({ roomId }: { roomId: string }) {
	const router = useRouter();
	const [socket, setSocket] = useState<WebSocket | null>(null);
	const [isOpen, setIsOpen] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [showChangeRoomModal, setShowChangeRoomModal] = useState(false);
	const [showConfirmDialog, setShowConfirmDialog] = useState(false);
	const [confirmAction, setConfirmAction] = useState<
		"home" | "changeRoom" | null
	>(null);
	const [newRoomData, setNewRoomData] = useState({ roomId: "", roomName: "" });
	const [isChangingRoom, setIsChangingRoom] = useState(false);
	const [changeRoomError, setChangeRoomError] = useState("");

	useEffect(() => {
		console.log("Attempting WebSocket connection...");
		const token = tokenManager.getToken();
		if (!token) {
			console.error("No valid authentication token found");
			setError("Authentication required. Please sign in again.");
			return;
		}

		const ws = new WebSocket(`${WS_URL}?token=${token}`);

		ws.onopen = () => {
			console.log("WebSocket opened!");
			setSocket(ws);
			setIsOpen(true);
			const data = JSON.stringify({
				type: "join_room",
				roomId,
			});
			ws.send(data);
		};

		ws.onclose = (event) => {
			console.warn("WebSocket closed", event);
			setIsOpen(false);
			setSocket(null);
		};

		ws.onerror = (err) => {
			console.error("WebSocket error", err);
			setIsOpen(false);
			setSocket(null);
		};

		return () => {
			ws.close();
		};
	}, [roomId]);

	const handleHomeClick = () => {
		setConfirmAction("home");
		setShowConfirmDialog(true);
	};

	const handleChangeRoomClick = () => {
		setConfirmAction("changeRoom");
		setShowConfirmDialog(true);
	};

	const handleConfirm = async () => {
		if (confirmAction === "home") {
			if (socket) {
				socket.close();
			}
			router.push("/");
		} else if (confirmAction === "changeRoom") {
			setShowConfirmDialog(false);
			setShowChangeRoomModal(true);
		}
	};

	const handleChangeRoom = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsChangingRoom(true);
		setChangeRoomError("");

		try {
			// Validate the new room
			const validateResponse = await fetch(
				`${HTTP_BACKEND}/room/validate-room`,
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						roomId: newRoomData.roomId,
						roomName: newRoomData.roomName,
					}),
				}
			);

			const validationData = await validateResponse.json();

			if (!validateResponse.ok) {
				setChangeRoomError(
					validationData.message || "Failed to validate room"
				);
				setIsChangingRoom(false);
				return;
			}

			// Close current WebSocket connection
			if (socket) {
				socket.close();
			}

			// Navigate to new room
			router.push(`/canvas/${newRoomData.roomId}`);
		} catch (error) {
			console.error("Change room error:", error);
			setChangeRoomError("Failed to join room");
			setIsChangingRoom(false);
		}
	};

	if (error) {
		return (
			<div className="flex items-center justify-center min-h-screen bg-red-50">
				<div className="text-center p-6 bg-white rounded-lg shadow-lg">
					<p className="text-red-600 mb-4">{error}</p>
					<button
						onClick={() => (window.location.href = "/")}
						className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
					>
						Go to Home
					</button>
				</div>
			</div>
		);
	}

	if (!socket || !isOpen) {
		return <div>Connecting to server....</div>;
	}

	return (
		<div className="relative w-full h-screen">
			{/* Top-left Navigation Buttons */}
			<div className="absolute top-4 left-4 z-50">
				<div className="flex items-center gap-2 bg-gray-900/90 backdrop-blur-sm border border-gray-700 rounded-xl px-4 py-2 shadow-lg">
					<button
						onClick={handleHomeClick}
						className="flex items-center gap-2 px-3 py-2 text-white hover:text-red-400 rounded-lg transition-colors duration-200 font-medium"
						title="Go Home"
					>
						<Home className="w-5 h-5" />
						Home
					</button>
					<div className="w-px h-6 bg-gray-600" />
					<button
						onClick={handleChangeRoomClick}
						className="flex items-center gap-2 px-3 py-2 text-white hover:text-red-400 rounded-lg transition-colors duration-200 font-medium"
						title="Change Room"
					>
						<DoorOpen className="w-5 h-5" />
						Change Room
					</button>
				</div>
			</div>

			{/* Confirmation Dialog */}
			{showConfirmDialog && (
				<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]">
					<div className="bg-white rounded-xl shadow-2xl p-6 max-w-sm mx-4">
						<h3 className="text-lg font-bold text-gray-900 mb-4">
							{confirmAction === "home"
								? "Leave Canvas?"
								: "Change Room?"}
						</h3>
						<p className="text-gray-600 mb-6">
							{confirmAction === "home"
								? "Are you sure you want to go home? Any unsaved changes will be lost."
								: "Are you sure you want to change rooms? Your connection to the current room will be closed."}
						</p>
						<div className="flex gap-3">
							<button
								onClick={() => setShowConfirmDialog(false)}
								className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors duration-200"
							>
								Cancel
							</button>
							<button
								onClick={handleConfirm}
								className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors duration-200"
							>
								Yes,{" "}
								{confirmAction === "home" ? "Go Home" : "Change Room"}
							</button>
						</div>
					</div>
				</div>
			)}

			{/* Change Room Modal */}
			{showChangeRoomModal && (
				<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]">
					<div className="bg-white rounded-xl shadow-2xl p-8 max-w-sm mx-4">
						<div className="flex items-center justify-between mb-6">
							<h3 className="text-xl font-bold text-gray-900">
								Join Another Room
							</h3>
							<button
								onClick={() => {
									setShowChangeRoomModal(false);
									setNewRoomData({ roomId: "", roomName: "" });
									setChangeRoomError("");
								}}
								className="text-gray-500 hover:text-gray-700"
							>
								<X className="w-5 h-5" />
							</button>
						</div>

						{changeRoomError && (
							<div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
								<p className="text-red-600 text-sm">
									{changeRoomError}
								</p>
							</div>
						)}

						<form onSubmit={handleChangeRoom} className="space-y-4">
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-2">
									Room ID
								</label>
								<input
									type="text"
									value={newRoomData.roomId}
									onChange={(e) =>
										setNewRoomData((prev) => ({
											...prev,
											roomId: e.target.value,
										}))
									}
									className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 text-gray-900"
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
									value={newRoomData.roomName}
									onChange={(e) =>
										setNewRoomData((prev) => ({
											...prev,
											roomName: e.target.value,
										}))
									}
									className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 text-gray-900"
									placeholder="Enter room name"
									required
								/>
							</div>
							<button
								type="submit"
								disabled={isChangingRoom}
								className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
							>
								{isChangingRoom ? "Joining..." : "Join Room"}
							</button>
						</form>
					</div>
				</div>
			)}

			<Canvas roomId={roomId} socket={socket} />
		</div>
	);
}
