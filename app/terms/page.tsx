import type { Metadata } from "next";
import { LegalPage, type LegalSection } from "@/components/legal/legal-page";

const lastUpdated = "August 8, 2026";

export const metadata: Metadata = {
  title: "Terms of Service | PrestonHQ",
  description: "Terms of Service for PrestonHQ, a private ER:LC moderation dashboard used by authorized City of Angels RP staff.",
  openGraph: {
    title: "Terms of Service | PrestonHQ",
    description: "Rules for authorized staff use of PrestonHQ and its ER:LC moderation dashboard.",
    siteName: "PrestonHQ",
    type: "website",
    url: "https://prestonhq.com/terms",
  },
};

const sections: LegalSection[] = [
  {
    id: "acceptance",
    title: "Acceptance of Terms",
    body: [
      "By accessing or using PrestonHQ, you agree to follow these Terms of Service. If you do not agree, you may not use the dashboard.",
    ],
  },
  {
    id: "dashboard-usage",
    title: "Dashboard Usage",
    body: [
      "PrestonHQ is a private web dashboard used by City of Angels RP staff to remotely manage our ER:LC server. The dashboard may include player management, moderation logs, command dispatch, staff permission controls, Discord authentication, and ER:LC API integrations.",
      "You are responsible for using the dashboard carefully, accurately, and only for legitimate server moderation purposes.",
    ],
  },
  {
    id: "authorized-staff",
    title: "Authorized Staff Only",
    body: [
      "Only approved City of Angels RP staff may access PrestonHQ. Access may be based on Discord authentication, staff roles, server permissions, or manual approval.",
      "You may not share your account, session, access token, or dashboard access with any other person.",
    ],
  },
  {
    id: "prohibited-activities",
    title: "Prohibited Activities",
    body: [
      "You agree not to misuse PrestonHQ, bypass permission checks, exploit bugs, access data you are not authorized to view, or interfere with the dashboard, Discord integration, ER:LC API, or connected services.",
    ],
    bullets: [
      "Do not use moderation actions for harassment, retaliation, or personal disputes.",
      "Do not attempt to extract, leak, or misuse API keys, logs, staff data, or player information.",
      "Do not automate dashboard actions without approval from ownership.",
    ],
  },
  {
    id: "abuse",
    title: "Abuse of the Dashboard",
    body: [
      "Abuse of PrestonHQ includes unnecessary bans, kicks, private messages, announcements, command spam, unauthorized permission changes, or any action that harms the ER:LC server, staff operations, or player trust.",
      "All moderation actions may be logged and reviewed by authorized leadership.",
    ],
  },
  {
    id: "suspension-removal",
    title: "Suspension or Removal of Access",
    body: [
      "PrestonHQ access may be suspended or removed at any time for security concerns, role changes, misuse, inactivity, staff removal, or violation of these Terms.",
    ],
  },
  {
    id: "liability",
    title: "Limitation of Liability",
    body: [
      "PrestonHQ is provided for internal server management. To the maximum extent permitted by law, PrestonHQ and its operators are not liable for indirect, incidental, or consequential damages arising from dashboard use, downtime, mistakes, third-party service issues, or ER:LC API behavior.",
    ],
  },
  {
    id: "availability",
    title: "Service Availability",
    body: [
      "We aim to keep PrestonHQ available and reliable, but access may be interrupted by maintenance, hosting issues, Discord outages, ER:LC API changes, network problems, or security events.",
    ],
  },
  {
    id: "changes",
    title: "Changes to the Terms",
    body: [
      "We may update these Terms as PrestonHQ, staff workflows, Discord authentication, or ER:LC API features change. Continued use after updates means you accept the revised Terms.",
    ],
  },
  {
    id: "contact",
    title: "Contact Information",
    body: [
      "For questions about these Terms, access issues, or dashboard policy concerns, contact support@prestonhq.com.",
    ],
  },
];

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of Service"
      description="These Terms explain the rules for using PrestonHQ as an authorized ER:LC moderation dashboard for City of Angels RP staff."
      lastUpdated={lastUpdated}
      sections={sections}
    />
  );
}
