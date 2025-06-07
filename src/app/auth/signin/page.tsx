import { Metadata } from "next";
import SignInForm from "@/components/auth/SignInForm";

export const metadata: Metadata = {
  title: "Sign In - UploadHaven",
  description:
    "Sign in to your UploadHaven account to access your files and continue uploading.",
};

export default function SignInPage() {
  return <SignInForm />;
}
