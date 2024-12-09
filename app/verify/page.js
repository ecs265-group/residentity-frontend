"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { getToken } from "@/utils/user";
import { ThreeDots as Loader } from "@/components/loaders";

export default function Verify() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null);

  useEffect(() => {
    if (!getToken()) {
      router.push("/login?returnTo=/verify");
    } else {
      setLoading(false);
    }
  }, []);

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsUploading(true);
    setUploadSuccess(false);
    setUploadStatus(null);

    try {
      const url = `${process.env.NEXT_PUBLIC_API_URL}/api/sign/verify`;
      const formData = new FormData();
      formData.append("file", file);

      const response = await axios.post(url, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        withCredentials: true,
      });
      setUploadSuccess(true);
      setUploadStatus(response.data.data.ownership);
    } catch (error) {
      setUploadSuccess(false);
      setUploadStatus(error.response.data.error.message);
    } finally {
      setIsUploading(false);
    }
  };

  if (loading) {
    return (
      <div className='flex justify-center mt-2'>
        <Loader />
      </div>
    );
  }

  return (
    <div className='flex items-center justify-center p-4 pt-20'>
      <div className='max-w-xl w-full bg-c0 shadow-md rounded-lg p-6'>
        <h1 className='text-3xl font-bold text-white mb-4 text-center'>Verify A Signed Document</h1>
        <h2 className='text-lg text-c2 mb-4 text-center'>
          Check the authenticity of a signed PDF.
        </h2>

        {/* Upload Button */}
        <div className='flex justify-center'>
          <label
            className={`inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm text-white font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white border border-c2 bg-c0 shadow-sm hover:bg-white hover:text-c0 h-9 px-4 py-2 ${
              isUploading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
            }`}
          >
            {isUploading ? "Uploading..." : "Upload PDF"}
            <input
              type='file'
              accept='application/pdf'
              onChange={handleFileUpload}
              className='hidden'
              disabled={isUploading}
            />
          </label>
        </div>

        {/* Status Messages */}
        <div className='mt-4 text-center'>
          {isUploading && (
            <div className='flex justify-center items-center space-x-2'>
              <div className='w-5 h-5 border-2 border-c2 border-t-transparent border-solid rounded-full animate-spin'></div>
              <p className='text-c2'>Uploading your file, please wait...</p>
            </div>
          )}
          {uploadSuccess ? (
            <div className='flex flex-col items-center'>
              <p className='text-green-500'>Ownership verified! Owner details:</p>
              {uploadStatus.split("\n").map((line, index) => (
                <p key={index} className='text-c2 text-sm'>
                  {line}
                </p>
              ))}
            </div>
          ) : (
            <p className='text-red-500'>{uploadStatus}</p>
          )}
        </div>
      </div>
    </div>
  );
}
