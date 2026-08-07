// "use client";

// import { motion, useScroll, useSpring } from "framer-motion";

// export default function ScrollProgressBar() {
//   const { scrollYProgress } = useScroll();

//   const scaleX = useSpring(scrollYProgress, {
//     stiffness: 40,   // lower = smoother
//     damping: 20,     // controls oscillation
//     mass: 0.8,       // adds weight → fluid motion
//     restDelta: 0.0001,
//   });

//   return (
//     <motion.div
//       className="fixed top-0 left-0 right-0 h-[6px] bg-brand z-50 origin-left"
//       style={{ scaleX }}
//     />
//   );
// }