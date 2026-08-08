import type { Metadata } from "next";
import { LegalPage, type LegalSection } from "@/components/legal/legal-page";

const lastUpdated = "August 8, 2026";

export const metadata: Metadata = {
  title: "Privacy Policy | PrestonHQ",
  description: "Privacy Policy for PrestonHQ, a private ER:LC moderation dashboard used by City of Angels RP staff.",
  openGraph: {
    title: "Privacy Policy | PrestonHQ",
    description: "How PrestonHQ collects, uses, stores, and protects Discord and ER:LC moderation dashboard data.",
    siteName: "PrestonHQ",
    type: "website",
    url: "https://prestonhq.com/privacy",
  },
};

const sections: LegalSection[] = [
  {
    id: "information-we-collect",
    title: "Information We Collect",
    body: [
      "PrestonHQ collects only the information needed to authenticate authorized City of Angels RP staff, display dashboard context, and maintain moderation accountability for our ER:LC server.",
    ],
    bullets: [
      "Discord ID, Discord username, and Discord avatar.",
      "Discord server permissions, staff roles, and authorization status.",
      "Login timestamps, session activity, and dashboard access events.",
      "Moderation logs, including staff member, target player, action type, reason, timestamp, and related audit details.",
    ],
  },
  {
    id: "how-we-use-information",
    title: "How We Use Information",
    body: [
      "We use collected information to verify staff access, display the correct dashboard permissions, operate moderation tools, protect the server from abuse, and review staff accountability when actions are taken through PrestonHQ.",
      "We do not sell personal information or use dashboard data for advertising.",
    ],
  },
  {
    id: "data-storage",
    title: "Data Storage",
    body: [
      "Dashboard configuration, staff authorization records, and moderation logs may be stored in PrestonHQ systems or connected infrastructure. Data is retained only as long as needed for moderation, security, audit, and operational purposes.",
      "Mock or development data may be used during testing, but production ER:LC moderation actions are intended to be stored as audit records for staff review.",
    ],
  },
  {
    id: "security",
    title: "Security",
    body: [
      "PrestonHQ uses access controls, staff permission checks, session security, and confirmation prompts for sensitive moderation actions. We limit dashboard access to authorized staff and aim to protect API keys, logs, and session data from unauthorized access.",
      "No system can be guaranteed perfectly secure, but we take reasonable steps to protect PrestonHQ and connected ER:LC moderation data.",
    ],
  },
  {
    id: "third-party-services",
    title: "Third-Party Services",
    body: [
      "PrestonHQ relies on third-party services to authenticate users and perform moderation functionality.",
    ],
    bullets: [
      "Discord is used for staff login, identity, roles, permissions, avatars, and related authorization checks.",
      "The ER:LC API is used to connect to and manage the City of Angels RP ER:LC server where approved.",
    ],
  },
  {
    id: "cookies-sessions",
    title: "Cookies and Sessions",
    body: [
      "PrestonHQ may use cookies, secure session tokens, or similar technologies to keep authorized users logged in, protect sessions, and remember dashboard state. These are used for authentication and security, not third-party advertising.",
    ],
  },
  {
    id: "user-rights",
    title: "User Rights",
    body: [
      "Authorized users may request access to, correction of, or deletion of personal dashboard information where appropriate. Some moderation logs may be retained when needed for server safety, abuse prevention, dispute review, or audit integrity.",
    ],
  },
  {
    id: "contact-information",
    title: "Contact Information",
    body: [
      "For privacy questions, data requests, or account access concerns, contact PrestonHQ at support@prestonhq.com.",
    ],
  },
  {
    id: "changes-policy",
    title: "Changes to this Policy",
    body: [
      "We may update this Privacy Policy as PrestonHQ, Discord authentication, ER:LC API access, or moderation features change. Updated versions will include a new Last Updated date.",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      description="This Privacy Policy explains how PrestonHQ handles data for the private ER:LC moderation dashboard used by City of Angels RP staff."
      lastUpdated={lastUpdated}
      sections={sections}
    />
  );
}
