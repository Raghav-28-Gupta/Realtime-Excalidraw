"use client";

import React from "react";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  message?: string;
  fullScreen?: boolean;
}

export function LoadingSpinner({
  size = "md",
  message = "Loading...",
  fullScreen = false,
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "w-6 h-6",
    md: "w-10 h-10",
    lg: "w-16 h-16",
  };

  const spinner = (
    <div className="flex flex-col items-center gap-4">
      {/* Animated spinner */}
      <div className="relative">
        <div
          className={`${sizeClasses[size]} border-4 border-purple-500/30 rounded-full`}
        />
        <div
          className={`${sizeClasses[size]} border-4 border-transparent border-t-purple-500 rounded-full animate-spin absolute top-0 left-0`}
        />
      </div>
      {/* Message */}
      {message && (
        <p className="text-gray-400 text-sm animate-pulse">{message}</p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-gray-900/90 backdrop-blur-sm flex items-center justify-center z-50">
        {spinner}
      </div>
    );
  }

  return spinner;
}

// Connection status spinner for WebSocket
export function ConnectionStatus({
  status,
  onRetry,
}: {
  status: "connecting" | "connected" | "disconnected" | "error";
  onRetry?: () => void;
}) {
  const statusConfig = {
    connecting: {
      color: "bg-yellow-500",
      text: "Connecting to server...",
      pulse: true,
    },
    connected: {
      color: "bg-green-500",
      text: "Connected",
      pulse: false,
    },
    disconnected: {
      color: "bg-gray-500",
      text: "Disconnected",
      pulse: true,
    },
    error: {
      color: "bg-red-500",
      text: "Connection error",
      pulse: true,
    },
  };

  const config = statusConfig[status];

  if (status === "connecting") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" message="Connecting to server..." />
          <p className="text-gray-500 text-xs mt-4">Please wait while we establish a connection</p>
        </div>
      </div>
    );
  }

  if (status === "error" || status === "disconnected") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center p-8 bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl max-w-md">
          <div
            className={`w-4 h-4 ${config.color} rounded-full mx-auto mb-4 ${config.pulse ? "animate-pulse" : ""}`}
          />
          <h2 className="text-xl font-bold text-white mb-2">
            {status === "error" ? "Connection Error" : "Disconnected"}
          </h2>
          <p className="text-gray-400 mb-6">{config.text}</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
            >
              Retry Connection
            </button>
          )}
        </div>
      </div>
    );
  }

  // Small indicator for connected status
  return (
    <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 bg-gray-800/80 backdrop-blur-sm px-3 py-2 rounded-full">
      <div
        className={`w-2 h-2 ${config.color} rounded-full ${config.pulse ? "animate-pulse" : ""}`}
      />
      <span className="text-xs text-gray-400">{config.text}</span>
    </div>
  );
}
