export type ServiceFailure =
  | "timeout"
  | "network"
  | "http"
  | "invalid_response";

export class ServiceRequestError extends Error {
  constructor(public readonly failure: ServiceFailure) {
    super(`service_request_${failure}`);
    this.name = "ServiceRequestError";
  }
}
