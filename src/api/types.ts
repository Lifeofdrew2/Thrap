export type TerminalReason =
  | "crisis"
  | "output_guard"
  | "classifier_failure"
  | "backend_failure"
  | "network_failure"
  | "invalid_response"
  | "human_route_failure";

export interface HumanRoute {
  role: string;
  channelLabel: string;
  actionTarget: string;
}

export interface EscalationResponse {
  kind: "escalation";
  message: string;
  humanRoute: HumanRoute;
  reasonCode?: TerminalReason;
}

export interface Citation {
  documentTitle: string;
  section: string;
  version?: string;
}

export interface TurnState {
  used: number;
  limit: number;
}

export interface AnswerResponse {
  kind: "answer";
  message: string;
  citations: Citation[];
  turn: TurnState;
  bookingPrompt?: boolean;
}

export interface RefusalResponse {
  kind: "refusal";
  message: string;
  humanRoute: HumanRoute;
  turn: TurnState;
}

export interface TurnLimitResponse {
  kind: "turn_limit";
  message: string;
  humanRoute: HumanRoute;
  turn: TurnState;
}

export type ServiceResponse =
  | AnswerResponse
  | RefusalResponse
  | EscalationResponse
  | TurnLimitResponse;
