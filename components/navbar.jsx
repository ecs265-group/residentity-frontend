"use client";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

export default function Navbar() {
  const router = useRouter();

  return (
    <nav className='w-full h-[8vh] bg-gradient-to-b from-c0/10 via-c0/50 to-c0/80 bg-c1 border-b border-white/5 justify-between px-20'>
      <div className='flex flex-row justify-between'>
        <button
          onClick={() => router.push("/")}
          className='flex items-center py-4 px-1 text-white text-3xl font-extrabold tracking-wide'
        >
          <span>ResIdentity</span>
        </button>
        <div className='inline-flex h-10 my-auto rounded-sm'>
          <div className='relative'>
            <div className='flex items-center justify-end space-x-2'>
              <button
                type='button'
                onClick={() => router.push("/sign")}
                className='inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm text-white font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white border border-c2 bg-c0 shadow-sm hover:bg-white hover:text-c0 h-9 px-4 py-2'
              >
                Sign a Document
              </button>
              <button
                type='button'
                onClick={() => router.push("/login?returnTo=/")}
                className='inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm text-white font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white border border-c2 bg-c0 shadow-sm hover:bg-white hover:text-c0 h-9 px-4 py-2'
              >
                Login
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
