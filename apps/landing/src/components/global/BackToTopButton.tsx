// "use client";

// import { motion, useScroll } from "framer-motion";
// import { useEffect, useState } from "react";

// export default function BackToTopButton() {
//   const { scrollY } = useScroll();
//   const [visible, setVisible] = useState(false);

//   useEffect(() => {
//     return scrollY.on("change", (latest) => {
//       setVisible(latest > 400); // show after scrolling 400px
//     });
//   }, [scrollY]);

//   const scrollToTop = () => {
//     window.scrollTo({
//       top: 0,
//       behavior: "smooth",
//     });
//   };

//   return (
//     <motion.button
//       onClick={scrollToTop}
//       initial={{ opacity: 0, y: 40 }}
//       animate={{
//         opacity: visible ? 1 : 0,
//         y: visible ? 0 : 40,
//       }}
//       transition={{ duration: 0.3 }}
//       className=" z-51 rounded-full bg-brand text-white px-4 py-2 shadow-lg cursor-pointer"
//     >
//       Top
//     </motion.button>
//   );
// }