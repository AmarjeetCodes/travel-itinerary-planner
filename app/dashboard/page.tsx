"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebaseConfig";
import { onAuthStateChanged, signOut } from "firebase/auth";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";

type Itinerary = {
  id: string;
  destination: string;
  date: string;
  activities: string;
  category: string;
  favorite?: boolean;
  createdAt?: any;
};

const CATEGORIES = [
  "adventure",
  "leisure",
  "work",
  "family",
  "romantic",
  "backpacking",
];

export default function DashboardPage() {
  const router = useRouter();

  const [uid, setUid] = useState<string | null>(null);
  const [name, setName] = useState<string | null>(null);

  const [destination, setDestination] = useState("");
  const [date, setDate] = useState("");
  const [activities, setActivities] = useState("");
  const [category, setCategory] = useState<string>("adventure");

  const [itineraries, setItineraries] = useState<Itinerary[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");

  // ---- Auth
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/login");
        return;
      }
      setUid(user.uid);

      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists()) {
        const data = userDoc.data() as { name?: string };
        setName(data?.name || user.displayName || "User");
      } else {
        setName(user.displayName || "User");
      }
    });
    return () => unsub();
  }, [router]);

  // ---- Subscribe itineraries
  useEffect(() => {
    if (!uid) return;
    const q = query(
      collection(db, "users", uid, "itineraries"),
      orderBy("createdAt", "desc")
    );
    const unsub = onSnapshot(q, (snap) => {
      const rows: Itinerary[] = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<Itinerary, "id">),
      }));
      setItineraries(rows);
      setLoading(false);
    });
    return () => unsub();
  }, [uid]);

  // ---- CRUD
  const handleAddItinerary = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uid) return;
    if (!destination.trim() || !date || !activities.trim()) return;

    await addDoc(collection(db, "users", uid, "itineraries"), {
      destination: destination.trim(),
      date,
      activities: activities.trim(),
      category,
      favorite: false,
      createdAt: serverTimestamp(),
    });

    setDestination("");
    setDate("");
    setActivities("");
    setCategory("adventure");
  };

  const handleDelete = async (id: string) => {
    if (!uid) return;
    await deleteDoc(doc(db, "users", uid, "itineraries", id));
  };

  const toggleFavorite = async (id: string, current?: boolean) => {
    if (!uid) return;
    await updateDoc(doc(db, "users", uid, "itineraries", id), {
      favorite: !current,
    });
  };

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/login");
  };

  const visibleItineraries = useMemo(() => {
    const s = search.trim().toLowerCase();
    return itineraries.filter((it) => {
      const matchesSearch =
        !s ||
        it.destination.toLowerCase().includes(s) ||
        it.activities.toLowerCase().includes(s);
      const matchesCategory =
        filterCategory === "all" || it.category === filterCategory;
      return matchesSearch && matchesCategory;
    });
  }, [itineraries, search, filterCategory]);

  return (
    <div className="p-6 min-h-screen bg-black text-white">
      {/* header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-semibold">Welcome, {name || "Loading..."}</h1>
        <button
          onClick={handleLogout}
          className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
        >
          Logout
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* left sidebar form */}
        <div className="w-full md:w-1/4">
          <form
            onSubmit={handleAddItinerary}
            className="bg-white text-black p-4 rounded shadow"
          >
            <h2 className="text-lg font-semibold mb-3">Add Itinerary</h2>

            <input
              type="text"
              placeholder="Destination"
              className="w-full p-2 mb-2 border rounded"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              required
            />

            <input
              type="date"
              className="w-full p-2 mb-2 border rounded"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />

            <textarea
              placeholder="Activities"
              className="w-full p-2 mb-2 border rounded"
              value={activities}
              onChange={(e) => setActivities(e.target.value)}
              required
            />

            <select
              className="w-full p-2 mb-3 border rounded"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c[0].toUpperCase() + c.slice(1)}
                </option>
              ))}
            </select>

            <button
              type="submit"
              className="w-full bg-green-500 text-white p-2 rounded hover:bg-green-600"
            >
              Add
            </button>
          </form>
        </div>

        {/* right content */}
        <div className="flex-1">
          {/* search / filter */}
          <div className="flex gap-3 mb-3">
            <input
              placeholder="Search destination or activities…"
              className="flex-1 p-2 border rounded bg-white text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select
              className="w-48 p-2 border rounded bg-white text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
            >
              <option value="all">All categories</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c[0].toUpperCase() + c.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {/* list */}
          <h2 className="text-lg font-semibold mb-2">Your Itineraries</h2>
          {loading ? (
            <p className="text-gray-300">Loading…</p>
          ) : visibleItineraries.length === 0 ? (
            <p className="text-gray-300">
              No itineraries match. Try adding or clearing filters.
            </p>
          ) : (
            <ul className="grid md:grid-cols-2 gap-3">
              {visibleItineraries.map((it) => (
                <li
                  key={it.id}
                  className="bg-zinc-900 border border-zinc-800 p-3 rounded"
                >
                  <div className="flex items-start justify-between">
                    <div className="pr-3">
                      <p className="font-bold">{it.destination}</p>
                      <p className="text-sm text-gray-300">
                        {it.date} • {it.category}
                      </p>
                      <p className="text-sm text-gray-300 mt-1">
                        {it.activities}
                      </p>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      <button
                        onClick={() => toggleFavorite(it.id, it.favorite)}
                        className={`text-xs px-2 py-1 rounded ${
                          it.favorite
                            ? "bg-yellow-600"
                            : "bg-zinc-700 hover:bg-zinc-600"
                        }`}
                      >
                        {it.favorite ? "★ Favorite" : "☆ Favorite"}
                      </button>

                      <button
                        onClick={() => handleDelete(it.id)}
                        className="text-xs bg-zinc-700 hover:bg-zinc-600 px-2 py-1 rounded"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
