// Type definitions for Update Command Center
// Sourced from rdn-automation/src/modules/new-update-analysis/types.ts

export interface RdnNewUpdateRecord {
  update_id: number;
  case_id: number;
  update_type: string | null;
  case_status: string | null;
  added_by: string | null;
  case_worker: string | null;
  update_date: string | null;
  debtor_name: string | null;
  client: string | null;
  lienholder: string | null;
  vehicle: string | null;
  update_content: string | null;
  content_category: string | null;
  extracted_at?: string;
  created_at?: string;
}

export type ClientCategory =
  | "close-request"
  | "reopen-request"
  | "hold-request"
  | "new-placement"
  | "new-instructions"
  | "address-update"
  | "info-request"
  | "disclaimer"
  | "other";

export type SystemCategory =
  | "drn-hit"
  | "storage-update"
  | "recovery-datetime"
  | "admin-action"
  | "other";

export type CheckInCategory =
  | "occupied-no-unit"
  | "collateral-inaccessible"
  | "lpr-scan"
  | "debtor-contact"
  | "vacant-address"
  | "other";

export type AgentCategory =
  | "address-added"
  | "field-observation"
  | "location-intel"
  | "voluntary-surrender"
  | "duplicate-address"
  | "other";

export type AgentRecoveryCategory = "on-hook" | "repossessed" | "other";

export type ContentCategory =
  | ClientCategory
  | SystemCategory
  | CheckInCategory
  | AgentCategory
  | AgentRecoveryCategory;

export type UpdateSourceType =
  | "Client"
  | "DRN Hit"
  | "Agent"
  | "System";
