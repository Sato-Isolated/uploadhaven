import { motion } from 'motion/react';

export function SignInFormBackground() {
  return (
    <>
      {/* Grid background */}
      <div className="bg-grid-white/10 bg-grid-16 absolute inset-0 [mask-image:radial-gradient(white,transparent_70%)]" />

      {/* Animated gradient orbs */}
      <motion.div
        className="absolute top-1/4 left-1/4 h-64 w-64 rounded-full bg-gradient-to-br from-blue-400/20 to-purple-600/20 blur-3xl"
        animate={{
          scale: [1, 1.2, 1],
          rotate: [0, 180, 360],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: 'linear',
        }}
      />
      <motion.div
        className="absolute right-1/4 bottom-1/4 h-80 w-80 rounded-full bg-gradient-to-br from-indigo-400/20 to-pink-600/20 blur-3xl"
        animate={{
          scale: [1.2, 1, 1.2],
          rotate: [360, 180, 0],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: 'linear',
        }}
      />
    </>
  );
}
