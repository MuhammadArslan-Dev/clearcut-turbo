"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

type GalleryImage = {
  id: number;
  src: string;
  title: string;
  location: string;
};

const IMAGES: GalleryImage[] = [
  {
    id: 1,
    src: "https://images.pexels.com/photos/2486168/pexels-photo-2486168.jpeg?auto=compress&cs=tinysrgb&w=1200",
    title: "Neon Streets",
    location: "Tokyo, Japan",
  },
  {
    id: 2,
    src: "https://images.pexels.com/photos/1439226/pexels-photo-1439226.jpeg?auto=compress&cs=tinysrgb&w=1200",
    title: "Mountain Lake",
    location: "Alps",
  },
  {
    id: 3,
    src: "https://images.pexels.com/photos/3408353/pexels-photo-3408353.jpeg?auto=compress&cs=tinysrgb&w=1200",
    title: "Golden Desert",
    location: "Sahara",
  },
  {
    id: 4,
    src: "https://images.pexels.com/photos/210205/pexels-photo-210205.jpeg?auto=compress&cs=tinysrgb&w=1200",
    title: "City Skyline",
    location: "New York, USA",
  },
  {
    id: 5,
    src: "https://images.pexels.com/photos/417074/pexels-photo-417074.jpeg?auto=compress&cs=tinysrgb&w=1200",
    title: "Forest Fog",
    location: "Vancouver, Canada",
  },
  {
    id: 6,
    src: "https://images.pexels.com/photos/462162/pexels-photo-462162.jpeg?auto=compress&cs=tinysrgb&w=1200",
    title: "Ocean Sunset",
    location: "Bali, Indonesia",
  },
];

export default function Page() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 flex items-center justify-center px-4 py-10">
      <AnimatedGallery />
    </div>
  );
}

function AnimatedGallery() {
  const [selected, setSelected] = useState<GalleryImage | null>(null);

  return (
    <>
      {/* Grid of thumbnails */}
      <motion.div
        className="w-full max-w-7xl"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 120, damping: 18 }}
      >
        <header className="mb-6">
          <h1 className="text-xl font-semibold tracking-tight">
            Travel Gallery
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Click an image to view it in full-screen with a smooth zoom
            animation.
          </p>
        </header>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
          {IMAGES.map((img) => (
            <motion.button
              key={img.id}
              type="button"
              onClick={() => setSelected(img)}
              className="group relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/50"
              whileHover={{ y: -4 }}
              whileTap={{ scale: 0.97 }}
            >
              {/* Shared layoutId: same id in grid and in lightbox */}
              <motion.img
                src={img.src}
                alt={img.title}
                className="h-52 w-full object-cover"
                layoutId={`image-${img.id}`}
              />

              {/* Gradient + text on hover */}
              <motion.div
                className="pointer-events-none absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/70 via-black/20 to-transparent p-3"
                initial={{ opacity: 0.2 }}
                whileHover={{ opacity: 1 }}
                transition={{ duration: 0.2 }}
              >
                <h3 className="text-sm font-semibold">{img.title}</h3>
                <p className="text-[11px] text-slate-300">{img.location}</p>
              </motion.div>
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Lightbox / fullscreen view */}
      <AnimatePresence>
        {selected && (
          <Lightbox
            image={selected}
            onClose={() => setSelected(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
}

/* ---------------- Lightbox component ---------------- */

function Lightbox({
  image,
  onClose,
}: {
  image: GalleryImage;
  onClose: () => void;
}) {
  return (
    <motion.div
      className="fixed inset-0 z-40 flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}

    >
      {/* Background overlay */}
      <motion.div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />

      {/* Centered image + info card */}
      <motion.div
        className="relative z-10 max-w-lg w-full px-4"
        layout
       
      >
        <motion.div
          className="relative overflow-hidden rounded-3xl border border-slate-700 bg-slate-900/80 shadow-2xl"
          layout
        >
          {/* big shared image */}
          <motion.img
            src={image.src}
            alt={image.title}
            layoutId={`image-${image.id}`}
            className="max-h-[60vh] w-full object-cover"
            transition={{
              type: "spring",
              stiffness: 180,
              damping: 20,
            }}
          />

          {/* caption + close button */}
          <div className="flex items-center justify-between px-4 py-3 text-sm">
            <div>
              <h3 className="font-semibold">{image.title}</h3>
              <p className="text-[11px] text-slate-400">
                {image.location} · Shot on a late evening walk.
              </p>
            </div>

            <motion.button
              type="button"
              onClick={onClose}
              className="rounded-full border border-slate-600 bg-slate-800/80 px-3 py-1 text-[11px] text-slate-200"
              whileHover={{ scale: 1.05, backgroundColor: "#0f172a" }}
              whileTap={{ scale: 0.95 }}
            >
              Close
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}