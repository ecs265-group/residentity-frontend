// app/auth/signin/page.js

"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ThreeDots as Loader } from "@/components/loaders";
import axios from "axios";
import { getToken } from "@/utils/user";

export default function Login() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pageLoading, setPageLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [buttonEnabled, setButtonEnabled] = useState(false);

  useEffect(() => {
    if (getToken()) {
      router.push("/");
    } else {
      setPageLoading(false);
    }
  }, []);

  useEffect(() => {
    if (email === "" || password === "" || !validateEmail(email)) {
      setButtonEnabled(false);
    } else {
      setButtonEnabled(true);
    }
  }, [email, password]);

  const validateEmail = (email) => {
    const re = /\S+@\S+\.\S+/;
    return re.test(email);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await axios.post(
        process.env.NEXT_PUBLIC_API_URL + "/api/login",
        {
          email,
          password,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
          withCredentials: true,
        }
      );
      if (res.status === 200) {
        const returnTo = searchParams.get("returnTo") || "/";
        window.location.href = returnTo;
      } else {
        setError(res.data.data.message);
      }
    } catch (error) {
      setError(
        error.response?.data?.error?.message || "An error occurred. Please try again later."
      );
    } finally {
      setLoading(false);
    }
  };

  if (pageLoading) {
    return (
      <div className='flex justify-center mt-2'>
        <Loader />
      </div>
    );
  }

  return (
    <div className='pt-20'>
      <div className='mx-auto w-1/3 flex flex-col items-center justify-center text-center border bg-c0 gap-4 rounded-lg border-white/15 p-6'>
        <h1 className='text-3xl text-white font-semibold p-4'>Login</h1>
        <form className='w-2/3 flex flex-col gap-2'>
          <label htmlFor='email' className='flex text-c2 text-sm font-medium'>
            Email
          </label>
          <input
            type='email'
            id='email'
            className='p-2 rounded-md text-white bg-c0 border border-white/15 placeholder-c2/50 text-sm focus:outline-none'
            placeholder='Email'
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyUp={(e) => (e.key === "Enter" ? handleSubmit(e) : null)}
          />
          <label htmlFor='password' className='flex text-c2 text-sm font-medium'>
            Password
          </label>
          <input
            type='password'
            id='password'
            className='p-2 rounded-md text-white bg-c0 border border-white/15 placeholder-c2/50 text-sm focus:outline-none'
            placeholder='Password'
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyUp={(e) => (e.key === "Enter" ? handleSubmit(e) : null)}
          />
          <button
            disabled={!buttonEnabled}
            className={`h-9 px-4 py-2 my-1 w-full flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors
							focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white border
							bg-c1 text-white border-c2 cursor-pointer
							hover:bg-white hover:text-c0
							disabled:bg-c1 disabled:text-c2 disabled:cursor-not-allowed`}
            onClick={(e) => handleSubmit(e)}
          >
            Login
          </button>
        </form>
        {loading ? (
          <div className='flex justify-center mt-2'>
            <Loader />
          </div>
        ) : null}
        {error ? <div className='text-red-500/90 text-sm text-center'>{error}</div> : null}
      </div>
    </div>
  );
}
