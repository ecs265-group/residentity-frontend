"use client";

import { useState } from "react";

export default function Verify() {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsUploading(true);
    setUploadSuccess(false);

    try {
      // Simulate a file upload delay (replace with real API upload logic)
      await new Promise((resolve) => setTimeout(resolve, 2000));

      console.log("Uploaded file:", file);

      setUploadSuccess(true);
    } catch (error) {
      console.error("File upload error:", error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full bg-white shadow-md rounded-lg p-6">
        <h1 className="text-xl font-bold text-gray-800 mb-4 text-center">
          Verify Document
        </h1>

        {/* Upload Button */}
        <div className="flex justify-center">
          <label
            className={`cursor-pointer bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md ${
              isUploading ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            {isUploading ? "Uploading..." : "Upload PDF"}
            <input
              type="file"
              accept="application/pdf"
              onChange={handleFileUpload}
              className="hidden"
              disabled={isUploading}
            />
          </label>
        </div>

        {/* Status Messages */}
        <div className="mt-4 text-center">
          {isUploading && (
            <div className="flex justify-center items-center space-x-2">
              <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent border-solid rounded-full animate-spin"></div>
              <p className="text-gray-500">
                Uploading your file, please wait...
              </p>
            </div>
          )}
          {uploadSuccess && (
            <p className="text-green-600 font-medium">
              PDF uploaded successfully!
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
