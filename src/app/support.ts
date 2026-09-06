import type { Region } from "../api/types";

export interface SupportContact {
  label: string;
  description: string;
  href: string;
}

export interface RegionalSupport {
  emergencyLabel: string;
  emergencyBody: string;
  emergencyContacts: SupportContact[];
  additionalLabel?: string;
  additionalBody?: string;
  additionalContacts?: SupportContact[];
}

const REGIONAL_SUPPORT: Record<string, RegionalSupport> = {
  NG: {
    emergencyLabel: "Nigeria emergency support",
    emergencyBody: "Call 112 or 767 if you are in immediate danger or need urgent help.",
    emergencyContacts: [
      { label: "112", description: "Emergency services", href: "tel:112" },
      { label: "767", description: "Emergency services", href: "tel:767" },
    ],
    additionalLabel: "MANI helpline",
    additionalBody: "Call 0809 210 6493. The Mentally Aware Nigeria Initiative helpline is available Monday to Friday.",
    additionalContacts: [
      { label: "0809 210 6493", description: "MANI helpline", href: "tel:08092106493" },
    ],
  },
  US: {
    emergencyLabel: "United States emergency support",
    emergencyBody: "Call 911 for immediate danger. Call or text 988 for the Suicide & Crisis Lifeline.",
    emergencyContacts: [
      { label: "911", description: "Emergency services", href: "tel:911" },
      { label: "988", description: "Suicide & Crisis Lifeline", href: "tel:988" },
    ],
  },
  CA: {
    emergencyLabel: "Canada emergency support",
    emergencyBody: "Call 911 for immediate danger. Call or text 988 for suicide crisis support.",
    emergencyContacts: [
      { label: "911", description: "Emergency services", href: "tel:911" },
      { label: "988", description: "Suicide Crisis Helpline", href: "tel:988" },
    ],
  },
  GB: {
    emergencyLabel: "United Kingdom emergency support",
    emergencyBody: "Call 999 or 112 for immediate danger. Call 116 123 for Samaritans emotional support.",
    emergencyContacts: [
      { label: "999", description: "Emergency services", href: "tel:999" },
      { label: "112", description: "Emergency services", href: "tel:112" },
    ],
    additionalLabel: "Samaritans",
    additionalBody: "Free emotional support is available by phone on 116 123.",
    additionalContacts: [
      { label: "116 123", description: "Samaritans", href: "tel:116123" },
    ],
  },
  AU: {
    emergencyLabel: "Australia emergency support",
    emergencyBody: "Call 000 for immediate danger. Call Lifeline on 13 11 14 for crisis support.",
    emergencyContacts: [
      { label: "000", description: "Emergency services", href: "tel:000" },
    ],
    additionalLabel: "Lifeline",
    additionalBody: "Crisis support is available by phone on 13 11 14.",
    additionalContacts: [
      { label: "13 11 14", description: "Lifeline", href: "tel:131114" },
    ],
  },
};

const FALLBACK_SUPPORT: RegionalSupport = {
  emergencyLabel: "Local emergency support",
  emergencyBody: "If you are in immediate danger, call your country's emergency number. For crisis support, contact a local crisis line or the configured human support route below.",
  emergencyContacts: [],
};

export function getRegionalSupport(region: Region): RegionalSupport {
  return REGIONAL_SUPPORT[region] ?? FALLBACK_SUPPORT;
}
