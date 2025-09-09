"use client";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { useEffect, useRef, useState } from "react";

dayjs.extend(relativeTime);

type NewsBlockProps = {
  title: string;
  source: string;
  timestamp: string;
  url?: string;
  imageUrl?: string;
  content: string | null;
};

const NewsBlock: React.FC<NewsBlockProps> = ({ title, source, timestamp, url, imageUrl, content}) => {
  let timeAgo = dayjs(timestamp).fromNow();
  const [loaded, setLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  const handleImgLoad = () => {
    setLoaded(true);
  }

  useEffect(() => {
    if (imgRef.current) {
      if (imgRef.current.complete) {
        handleImgLoad();
      } else {
        imgRef.current.onload = handleImgLoad;
      }
    }
  }, [imageUrl]);

  return (
    <a
      href={url || "#"}
      target="_blank"
      rel="noopener noreferrer"
      className="newsblock block border-3 hover:border-tertiary border-secondary rounded-2xl overflow-hidden hover:shadow-lg no-underline mb-3 group"
    >
      {imageUrl && (
        <div className="newsblock-img-container relative w-full min-h-32 max-h-64 overflow-hidden">
          {/* Blurry placeholder */}
          {/* <img
                src={imageUrl}
                alt={title}
                className={`absolute top-0 left-0 w-full h-full object-cover transition-opacity duration-500 ${
                  loaded ? "hidden" : "opacity-100 blur-xl scale-105"
                }`}
              /> */}
          {/* Full image */}
          <div
            className={`absolute top-0 left-0 w-full h-full bg-gray-500 transition-opacity duration-500 not-dark:bg-gray-300 ${
              !loaded ? "animate-pulse" : "opacity-0 pointer-none:"
            }`}
          ></div>

          <img
            ref={imgRef}
            loading="lazy"
            onLoad={handleImgLoad}
            src={imageUrl}
            className={`w-full object-cover aspect-square transition-opacity duration-500 max-h-64 z-10 ${
              !loaded ? "opacity-0" : "opacity-100"
            }`}
          />
        </div>
      )}

      <div className="pb-5 px-4 pt-3 flex flex-col">
        {/* Source and timestamp row */}

        {/* Title */}
        <h2 className="text-xl mt-1 font-semibold break-words group-hover:underline">{title}</h2>

        {/* Content */}
        {content && <p className="text-base text-text/80 mt-4 line-clamp-3 break-words">{content}</p>}

        <div className="flex items-center justify-start text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-5">
          <span className="">
            {timeAgo.charAt(0).toUpperCase() === "A" ? "1" : timeAgo.charAt(0).toUpperCase()}
            {timeAgo.slice(1)}
          </span>
          <span className="mx-2 text-foreground">|</span>
          <span className="font-medium">{source}</span>
        </div>
      </div>
    </a>
  );
};

export default NewsBlock;
