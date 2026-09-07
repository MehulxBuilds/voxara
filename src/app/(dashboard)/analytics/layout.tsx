import { AnalyticsLayout } from "@/features/analytics/views/analytics-layout";

export default function Layout({ 
  children
}: { 
  children: React.ReactNode
}) {
  return <AnalyticsLayout>{children}</AnalyticsLayout>;
};