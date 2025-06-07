import { Metadata } from "next";
import SignUpForm from "@/components/auth/SignUpForm";

export const metadata: Metadata = {
  title: "Sign Up - UploadHaven",
  description:
    "Create your UploadHaven account to manage files and get extended storage with advanced features.",
};

export default function SignUpPage() {
  return <SignUpForm />;
}
