"use client";

import { useState } from "react";
import { db, auth } from "@/lib/firebaseConfig";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useRouter } from "next/navigation";

export default function NewItineraryPage() {
  const [destination, setDestination] = useState("");
  const [activities, setActivities] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [tripType, setTripType] = useState("Leisure");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("Not authenticated");

      await addDoc(collection(db, "itineraries"), {
        userId: user.uid,
        destination,
        activities,
        startDate,
        endDate,
        tripType,
        createdAt: serverTimestamp(),
      });

      router.push("/dashboard"); // after saving, go back to dashboard
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded-lg shadow-md w-96"
      >
        <h1 className="text-xl font-bold mb-4 text-center">
          Add New Itinerary
        </h1>
        {error && <p className="text-red-500 mb-2">{error}</p>}

        <input
          type="text"
          placeholder="Destination"
          className="w-full p-2 mb-2 border rounded"
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
          required
        />

        <textarea
          placeholder="Activities"
          className="w-full p-2 mb-2 border rounded"
          value={activities}
          onChange={(e) => setActivities(e.target.value)}
          required
        />

        <label className="block mb-1">Start Date</label>
        <input
          type="date"
          className="w-full p-2 mb-2 border rounded"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          required
        />

        <label className="block mb-1">End Date</label>
        <input
          type="date"
          className="w-full p-2 mb-2 border rounded"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          required
        />

        <select
          className="w-full p-2 mb-4 border rounded"
          value={tripType}
          onChange={(e) => setTripType(e.target.value)}
        >
          <option value="Leisure">Leisure</option>
          <option value="Adventure">Adventure</option>
          <option value="Work">Work</option>
        </select>

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
        >
          Save Itinerary
        </button>
      </form>
    </div>
  );
}
