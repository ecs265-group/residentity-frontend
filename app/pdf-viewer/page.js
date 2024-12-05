"use client";
import { useSearchParams } from "next/navigation";
import { Viewer } from "@react-pdf-viewer/core";
import { defaultLayoutPlugin } from "@react-pdf-viewer/default-layout";
import "@react-pdf-viewer/core/lib/styles/index.css";
import "@react-pdf-viewer/default-layout/lib/styles/index.css";

export default function PdfViewer() {
  const searchParams = useSearchParams();
  const fileUrl = searchParams.get("fileUrl");
  const defaultLayoutPluginInstance = defaultLayoutPlugin();

  if (!fileUrl) {
    return <div>No PDF file selected.</div>;
  }

  return (
    <div className="pdf-viewer">
      <Viewer fileUrl={fileUrl} plugins={[defaultLayoutPluginInstance]} />
    </div>
  );
}
