"use client";

import React, { useEffect, useRef, useState } from "react";
import { useMainVideoProgressTrackerStore } from "../../store/useMainVideoProgressTracker";
import { useVideoPlayerStore } from "../../store/useVideoPlayerStore";

/* ----------------------------------
   Load YouTube IFrame API
----------------------------------- */
export function loadYouTubeAPI(): Promise<void> {
  return new Promise((resolve) => {
    if ((window as any).YT && (window as any).YT.Player) {
      resolve();
      return;
    }

    const existingScript = document.getElementById("youtube-iframe-api");

    if (!existingScript) {
      const tag = document.createElement("script");
      tag.id = "youtube-iframe-api";
      tag.src = "https://www.youtube.com/iframe_api";
      document.body.appendChild(tag);
    }

    (window as any).onYouTubeIframeAPIReady = () => resolve();
  });
}

/* ----------------------------------
   Extract Video ID
----------------------------------- */
function getVideoId(input: string): string | null {
  if (/^[\w-]{11}$/.test(input)) return input;

  try {
    const url = new URL(input);

    if (url.hostname.includes("youtube.com")) {
      if (url.pathname === "/watch") return url.searchParams.get("v");
      if (url.pathname.startsWith("/embed/"))
        return url.pathname.split("/embed/")[1];
    }

    if (url.hostname === "youtu.be") {
      return url.pathname.slice(1);
    }
  } catch {}

  return null;
}

interface VideoCardProps {
  url: string;
  showPlayButton?: boolean;
  onClick?: () => void;
}

export default function VideoCard({
  url,
  showPlayButton = true,
  onClick,
}: VideoCardProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const intervalRef = useRef<number | null>(null);

  const pendingPlayRef = useRef(false);

  const [isReady, setIsReady] = useState(false);
  const [hasClicked, setHasClicked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { setPlayer } = useVideoPlayerStore();
  const { setProgress, setIsPlaying, reset } =
    useMainVideoProgressTrackerStore();

  /* ---------- Init Player ---------- */
  useEffect(() => {
    setHasClicked(false);
    setIsReady(false);
    setIsLoading(false);

    const videoId = getVideoId(url);
    if (!videoId || !containerRef.current) return;

    let mounted = true;

    loadYouTubeAPI().then(() => {
      if (!mounted) return;

      reset();

      playerRef.current = new (window as any).YT.Player(containerRef.current, {
        videoId,

        playerVars: {
          controls: 1,
          rel: 0,
          playsinline: 1,
          mute: 1,
          modestbranding: 1,
        },

        events: {
          onReady: (event: any) => {
            if (!mounted) return;

            setIsReady(true);
            event.target.mute();
            setPlayer(event.target);
            if (pendingPlayRef.current) {
              event.target.playVideo();
              pendingPlayRef.current = false;
            }
          },

          onStateChange: (event: any) => {
            const state = event.data;

            if (state === (window as any).YT.PlayerState.PLAYING) {
              setIsPlaying(true);
              setIsLoading(false);
              setHasClicked(true);

              event.target.unMute();

              if (!intervalRef.current) {
                intervalRef.current = window.setInterval(() => {
                  setProgress(
                    playerRef.current?.getCurrentTime() ?? 0,
                    playerRef.current?.getDuration() ?? 0,
                  );
                }, 500);
              }
            }

            if (state === (window as any).YT.PlayerState.BUFFERING) {
              setIsLoading(true);
            }

            if (
              state === (window as any).YT.PlayerState.PAUSED ||
              state === (window as any).YT.PlayerState.ENDED
            ) {
              setIsPlaying(false);
            }
          },
        },
      });
    });

    return () => {
      mounted = false;

      if (playerRef.current) {
        playerRef.current.destroy();
      }

      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
      }
    };
  }, [url, reset, setIsPlaying, setProgress]);

  /* ---------- Play handler ---------- */
  const handlePlay = () => {
    onClick?.();

    setHasClicked(true);
    setIsLoading(true);

    if (isReady) {
      playerRef.current?.playVideo();
    } else {
      pendingPlayRef.current = true;
    }
  };

  return (
    <div className="relative aspect-video bg-black overflow-hidden">
      <div ref={containerRef} className="w-full h-full" />

      {/* Loader */}
      {isLoading && hasClicked && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-20">
          <div className="w-10 h-10 border-4 border-white border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Start Button */}
      {showPlayButton && !hasClicked && (
        <button
          onClick={handlePlay}
          className="absolute inset-0 z-10 flex items-center justify-center bg-black/40 hover:bg-black/50"
        >
          <span className="w-[200px] h-[48px] flex items-center justify-center rounded-full bg-blue-500 text-white font-semibold shadow-lg">
            Start Video
          </span>
        </button>
      )}
    </div>
  );
}
