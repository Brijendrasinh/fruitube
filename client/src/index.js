import React, { useState, useEffect } from "react";
import { createRoot } from "react-dom/client"; // Updated import
import axios from "axios";
import { io } from "socket.io-client";

const URL = "http://localhost:5000/";
const socket = io(URL);

const App = () => {
  const [urlText, setUrlText] = useState("");
  const [respData, setRespData] = useState(null);
  const [percentage, setPercentage] = useState(0);
  const [dataDownloaded, setDataDownloaded] = useState(0);
  const [dataToBeDownloaded, setDataToBeDownloaded] = useState(0);
  const [videoDetails, setVideoDetails] = useState({ name: "", uploader: "" });

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.post(
        URL,
        { url: urlText },
        {
          responseType: "blob",
          onDownloadProgress: (progressEvent) => {
            setDataDownloaded(progressEvent.loaded);
          },
        }
      );

      const blob = new Blob([response.data]);
      const blobUrl = window.URL.createObjectURL(blob);
      setRespData(blobUrl);
    } catch (error) {
      console.error("Error during download:", error);
    }
  };

  useEffect(() => {
    socket.on("progressEventSocket", (data) => {
      setPercentage(data[0]);
    });

    socket.on("downloadCompletedServer", (data) => {
      setDataToBeDownloaded(data[0]);
    });

    socket.on("videoDetails", ([name, uploader]) => {
      setVideoDetails({ name, uploader });
    });

    return () => {
      socket.off("progressEventSocket");
      socket.off("downloadCompletedServer");
      socket.off("videoDetails");
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md"
      >
        <h1 className="text-2xl font-bold mb-4 text-gray-700">Fruittube</h1>
        <input
          type="text"
          value={urlText}
          onChange={(e) => setUrlText(e.target.value)}
          placeholder="Enter Video URL"
          className="w-full border border-gray-300 rounded-md p-2 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
        <button
          type="submit"
          className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition"
        >
          Start Process
        </button>
      </form>

      {videoDetails.name && (
        <div className="bg-white p-4 mt-6 rounded-lg shadow-lg w-full max-w-md">
          <h2 className="text-lg font-bold">Title: {videoDetails.name}</h2>
          <p className="text-gray-600">Uploaded by: {videoDetails.uploader}</p>
        </div>
      )}

      <div className="w-full max-w-md mt-6">
        <div className="text-gray-600 text-sm mb-2">Processing Progress</div>
        <div className="w-full bg-gray-200 rounded-full h-4">
          <div
            className="bg-blue-500 h-4 rounded-full transition-all"
            style={{ width: `${percentage}%` }}
          ></div>
        </div>
        <p className="text-sm mt-2">{percentage.toFixed(2)}% completed</p>
      </div>

      <div className="w-full max-w-md mt-6">
        <div className="text-gray-600 text-sm mb-2">Download Progress</div>
        <div className="w-full bg-gray-200 rounded-full h-4">
          <div
            className="bg-green-500 h-4 rounded-full transition-all"
            style={{
              width: `${
                dataToBeDownloaded > 0
                  ? (dataDownloaded / dataToBeDownloaded) * 100
                  : 0
              }%`,
            }}
          ></div>
        </div>
        <p className="text-sm mt-2">
          {(
            (dataDownloaded / dataToBeDownloaded || 0) *
            100
          ).toFixed(2)}{" "}
          % downloaded
        </p>
      </div>

      {respData && (
        <div className="mt-6">
          <p className="text-gray-700 mb-2">
            Download is ready! Click the button below:
          </p>
          <a
            href={respData}
            download={`${videoDetails.name || "video"}.mp3`}
            className="bg-red-500 text-white py-2 px-4 rounded-md hover:bg-red-600 transition"
          >
            Download
          </a>
        </div>
      )}
    </div>
  );
};

const root = createRoot(document.getElementById("root")); // Updated to use createRoot
root.render(<App />);
