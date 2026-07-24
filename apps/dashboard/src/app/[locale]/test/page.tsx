"use client";
import { useRef } from "react";

const topics = [
  "React",
  "Next.js",
  "Vue",
  "Angular",
  "Svelte",
  "Solid",
  "Remix",
];

export default function Page() {
  const containerRef = useRef(null);
  const itemRefs = useRef([]);

  const handleClick = (index) => {
    const container = containerRef.current;
    const item = itemRefs.current[index];

    const containerWidth = container.offsetWidth;
    const itemWidth = item.offsetWidth;
    const itemLeft = item.offsetLeft;

    const scrollLeft = itemLeft - containerWidth / 2 + itemWidth / 2;

    container.scrollTo({
      left: scrollLeft,
      behavior: "smooth",
    });
  };

  return (
    <div>
      <div
        ref={containerRef}
        style={{
          display: "flex",
          overflowX: "auto",
          gap: "16px",
          padding: "20px",
          border: "1px solid #ccc",
        }}
      >
        {topics.map((topic, index) => (
          <button
            key={topic}
            ref={(el) => (itemRefs.current[index] = el)}
            onClick={() => handleClick(index)}
            style={{
              padding: "10px 20px",
              flex: "0 0 auto",
            }}
          >
            {topic}
          </button>
        ))}
      </div>
    </div>
  );
}
