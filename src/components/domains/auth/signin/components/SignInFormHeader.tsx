import { motion } from "motion/react";
import { CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Upload } from "lucide-react";

export function SignInFormHeader() {
  return (
    <CardHeader className="space-y-4 relative z-10 text-center pb-6">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
        className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg"
      >
        <Upload className="h-8 w-8 text-white" />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <CardTitle className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
          Welcome Back
        </CardTitle>
        <CardDescription className="text-gray-600 dark:text-gray-400 mt-2">
          Sign in to access your files and continue uploading
        </CardDescription>
      </motion.div>
    </CardHeader>
  );
}
