"use client";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { defaultLayoutPlugin } from "@react-pdf-viewer/default-layout";
import * as pdfjsLib from "pdfjs-dist";
import "@react-pdf-viewer/core/lib/styles/index.css";
import "@react-pdf-viewer/default-layout/lib/styles/index.css";

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.10.377/pdf.worker.js`;

export default function Navbar() {
  const router = useRouter();
  const [fileUrl, setFileUrl] = useState(null);
  const defaultLayoutPluginInstance = defaultLayoutPlugin();

  // Clean up the Object URL to prevent memory leaks
  useEffect(() => {
    return () => {
      if (fileUrl) {
        URL.revokeObjectURL(fileUrl);
      }
    };
  }, [fileUrl]);

  // const handleFileUpload = (event) => {
  //   const selectedFile = event.target.files[0];
  //   console.log(selectedFile);
  //   if (selectedFile) {
  //     // Check if the file is a PDF
  //     if (selectedFile.type !== "application/pdf") {
  //       alert("Please select a PDF file.");
  //       return;
  //     }
  //     const url = URL.createObjectURL(selectedFile);
  //     setFileUrl(url);
  //     <Viewer fileUrl={fileUrl} plugins={[defaultLayoutPluginInstance]} />;
  //   }
  // };

  const onFileChange = (event) => {
    const selectedFile = event.target.files[0];
    if (!selectedFile) {
      alert("Please select a PDF file.");
      return;
    }
    const url = URL.createObjectURL(selectedFile);
    setFileUrl(url);
    // Navigate to the new route with the file URL as a query parameter
    router.push(`/pdf-viewer?fileUrl=${encodeURIComponent(url)}`);
  };

  const onLoadSuccess = ({ numPages }) => {
    setNumPages(numPages); // Set number of pages when the PDF is loaded
  };

  return (
    <nav className="w-full h-[8vh] bg-gradient-to-b from-c0/10 via-c0/50 to-c0/80 bg-c1 border-b border-white/5 justify-between px-20">
      <div className="flex flex-row justify-between">
        <button
          onClick={() => router.push("/")}
          className="flex items-center py-4 px-1 text-white text-3xl font-extrabold tracking-wide"
        >
          <span>ResIdentity</span>
        </button>
        <div className="inline-flex h-10 my-auto rounded-sm">
          <div className="relative">
            <div className="flex items-center justify-end space-x-2">
              <label
                htmlFor="upload-pdf"
                className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm text-white font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white border border-c2 bg-c0 shadow-sm hover:bg-white hover:text-c0 h-9 px-4 py-2 cursor-pointer"
              >
                Upload PDF
              </label>
              <input
                id="upload-pdf"
                type="file"
                accept=".pdf"
                onChange={onFileChange}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => router.push("/login?returnTo=/")}
                className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm text-white font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white border border-c2 bg-c0 shadow-sm hover:bg-white hover:text-c0 h-9 px-4 py-2"
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
