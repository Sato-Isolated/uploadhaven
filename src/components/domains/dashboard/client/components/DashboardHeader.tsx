// components/DashboardHeader.tsx - Dashboard header with user info and navigation

"use client";

import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import SignOutButton from "@/components/domains/auth/SignOutButton";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Upload, User, ArrowRight } from "lucide-react";

interface DashboardHeaderProps {
  userName: string;
}

export default function DashboardHeader({ userName }: DashboardHeaderProps) {
  return (
    <motion.div
      className="flex items-center justify-between mb-8"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <div>
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          <div className="flex items-center space-x-4 mb-3">
            <motion.div
              className="relative"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <div className="p-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-xl">
                <User className="h-8 w-8 text-white" />
              </div>
              <motion.div
                className="absolute -inset-1 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl opacity-30 blur"
                animate={{
                  scale: [1, 1.1, 1],
                  opacity: [0.3, 0.5, 0.3],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            </motion.div>
            <div>
              <motion.h1
                className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.6 }}
              >
                My Dashboard
              </motion.h1>
              <motion.p
                className="text-lg text-gray-600 dark:text-gray-400 mt-1"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.6 }}
              >
                Welcome back,
                <span className="font-semibold text-gray-800 dark:text-gray-200">
                  {userName}
                </span>
              </motion.p>
            </div>
          </div>
        </motion.div>
      </div>      <motion.div
        className="flex items-center gap-4"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.4, duration: 0.6 }}
      >
        <ThemeToggle />
        <Link href="/">
          <motion.div
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0 shadow-lg h-11 px-6">
              <Upload className="h-5 w-5 mr-2" />
              Upload Files
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </motion.div>
        </Link>
        <SignOutButton />
      </motion.div>
    </motion.div>
  );
}
