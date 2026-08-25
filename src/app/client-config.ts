import type { HumanRoute } from "../api/types";

export const localHumanRoute: HumanRoute = {
  role: "Licensed counsellor",
  channelLabel: "confidential EAP support portal",
  actionTarget: "#eap-support-portal",
};

export const escalationCopy = {
  heading: "Let's get you real support",
  body: "It sounds like what you're going through deserves more than I can safely offer here. A licensed counsellor is available now and can provide the professional care you deserve.",
  terminal: "This session is closed. Your wellbeing matters — please reach out to the human support below.",
};
