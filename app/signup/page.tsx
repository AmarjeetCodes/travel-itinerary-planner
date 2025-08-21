"use client";

import { useState } from "react";
import { auth, db } from "@/lib/firebaseConfig";
import {
  createUserWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";

export default function SignupPage() {
  const [curstate, setCurstate] = useState<"idle" | "busy">("idle");
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleSignup(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    if (!name || !email || !password) {
      setError("All fields are required");
      return;
    }

    try {
      setCurstate("busy");
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      await updateProfile(userCredential.user, { displayName: name });

      await setDoc(doc(db, "users", userCredential.user.uid), {
        name,
        email,
        createdAt: new Date(),
      });

      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setCurstate("idle");
    }
  }

  return (
    <div
      className="min-h-screen flex flex-col justify-center items-center bg-cover bg-center"
      style={{
        backgroundImage:
          "url('https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&auto=format&fit=crop&q=80')",
      }}
    >
      {/* Stylish Heading */}
      <h1 className="text-4xl md:text-5xl font-extrabold text-gray-800 drop-shadow-lg mb-10 text-center">
         Plan and Keep Your Memories Here ✈️
      </h1>

      <Card className="sm:w-[400px] w-[90%] shadow-2xl border-none bg-white/90 backdrop-blur-md">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-pink-500">
            Signup
          </CardTitle>
          <CardDescription className="text-gray-600">
            Create a New Account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {error && (
              <div className="mt-2 text-center text-md text-red-900">
                {error}
              </div>
            )}

            <form onSubmit={handleSignup} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" name="name" placeholder="John Doe" type="text" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  placeholder="john.doe@example.com"
                  type="email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="********"
                />
              </div>

              <Button
                className="w-full text-md bg-pink-600 hover:bg-gray-700 text-white"
                type="submit"
                disabled={curstate === "busy"}
              >
                {curstate === "busy" ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing up
                  </>
                ) : (
                  "Signup"
                )}
              </Button>
            </form>

            <div className="mt-4 text-center text-md text-gray-700">
              Already have an account?{" "}
              <button
                className="underline text-indigo-600"
                onClick={() => router.push("/login")}
              >
                Login
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
