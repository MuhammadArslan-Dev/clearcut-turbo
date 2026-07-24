// Success states
export type SuccessStatus =
  | "idle"
  | "loading"
  | "pending"
  | "processing"
  | "success";

// Client-side errors
export type ClientErrorStatus =
  | "error"
  | "validation_error"
  | "bad_request"
  | "unauthorized"
  | "forbidden"
  | "not_found";

// Network errors
export type NetworkErrorStatus =
  | "network_error"
  | "timeout"
  | "offline";

// Server errors
export type ServerErrorStatus =
  | "server_error"
  | "internal_error"
  | "maintenance"
  | "service_unavailable";

// Combined Status (Export this)
export type Status =
  | SuccessStatus
  | ClientErrorStatus
  | NetworkErrorStatus
  | ServerErrorStatus;
