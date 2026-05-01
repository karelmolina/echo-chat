"use client";

import { useState } from "react";

export default function HomePage(): React.JSX.Element {
  const [message, setMessage] = useState("");

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 p-4">
        <p className="text-gray-500">Start a new conversation...</p>
      </div>
      <form
        className="p-4 border-t border-gray-200"
        onSubmit={(e) => {
          e.preventDefault();
          setMessage("");
        }}
      >
        <div className="flex gap-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}
