import axios from "axios";
import React, { useEffect, useState } from "react";

interface PlaylistItem {
  etag: string;
  id: string;
  kind: string;
  snippet: {
    title: string;
    description: string;
    thumbnails: {
      default: { url: string };
    };
    resourceId: {
      kind: string;
      videoId: string;
    };
  };
}

const Videos: React.FC = () => {
  const [videoList, setVideoList] = useState<PlaylistItem[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.post(`${process.env.REACT_APP_API_URL}/video`, {
          pl_type: "EMERGENCY",
        });
        const playlist = res.data.result[0].pl_url;
        const response = await axios.get(
          `https://www.googleapis.com/youtube/v3/playlistItems`,
          {
            params: {
              part: "snippet",
              maxResults: 25,
              playlistId: playlist,
              key: process.env.REACT_APP_YOUTUBE_KEY,
            },
          }
        );

        // 데이터 정렬 (제목 기준 오름차순)
        const sortedItems = response.data.items.sort(
          (a: PlaylistItem, b: PlaylistItem) => {
            // 제목에서 숫자 추출
            const numA = parseInt(a.snippet.title.replace(/\D/g, ""), 10) || 0;
            const numB = parseInt(b.snippet.title.replace(/\D/g, ""), 10) || 0;
            return numA - numB; // 오름차순 정렬
          }
        );

        setVideoList(sortedItems.reverse());
      } catch (e) {
        console.log(e);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="p-3 sm:p-10">
      <div className="flex flex-col">
        <span className="font-bold text-xl">비상 영상 리스트</span>
      </div>
      <div className="relative overflow-x-auto shadow-md sm:rounded-lg my-4">
        <table className="w-full text-sm text-left rtl:text-right text-gray-500">
          <thead className="text-xs text-white font-bold uppercase bg-custom-C4C4C4">
            <tr>
              <th
                scope="col"
                className="px-1 sm:px-2 lg:px-6 py-3 text-center text-base"
              >
                No
              </th>
              <th
                scope="col"
                className="px-1 sm:px-2 lg:px-6 py-3 text-center text-base"
              >
                제목
              </th>
            </tr>
          </thead>
          <tbody>
            {videoList.map((video, index) => (
              <tr
                key={video.etag}
                className={`bg-white border-b hover:bg-gray-100`}
                onClick={() =>
                  window.open(
                    `https://www.youtube.com/watch?v=${video.snippet.resourceId.videoId}`
                  )
                }
              >
                <td className="px-1 sm:px-2 lg:px-6 py-4 text-black text-center text-base">
                  {videoList.length - index}
                </td>
                <td className="px-1 sm:px-2 lg:px-6 py-4 text-black text-center text-base">
                  {video.snippet.title}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Videos;
