"use client";

import { motion } from "motion/react";
import FeaturesSection from "./components/FeaturesSection";
import UploadLimitsSection from "./components/UploadLimitsSection";
import ApiInfoSection from "./components/ApiInfoSection";
import FaqSection from "./components/FaqSection";
import {
  createFeatureItems,
  createApiEndpoints,
  createFaqItems,
  createExampleCommand,
} from "./utils";

export default function InfoPanel() {
  const features = createFeatureItems();
  const apiEndpoints = createApiEndpoints();
  const faqItems = createFaqItems();
  const exampleCommand = createExampleCommand();

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <FeaturesSection features={features} /> <UploadLimitsSection />
      <ApiInfoSection
        endpoints={apiEndpoints}
        exampleCommand={exampleCommand}
      />
      <FaqSection faqs={faqItems} />
    </motion.div>
  );
}
