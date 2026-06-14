import { CreateEsimDto } from '../esim/adapters/create-esim.dto';

// ── Response shapes ────────────────────────────────────────────────────────

export interface CreateEsimResponse {
  iccid: string;
  activationCode: string; // LPA:1$<host>$<hash> — scanned by device to install eSIM
  expiryDate: Date;
}

export interface ProviderStatusResponse {
  status: 'SUCCESS' | 'FAILED' | 'PENDING';
  message?: string;
}

export interface TopupEsimResponse {
  iccid: string;
  addedData: number; // MB added
  newExpiryDate?: Date;
  status: 'SUCCESS' | 'FAILED';
  message?: string;
}

// ── Contract ───────────────────────────────────────────────────────────────
//
// Implement this interface to add a real eSIM provider.
// Register the implementation in EsimModule by binding PROVIDER_ADAPTER
// to your class and setting the PROVIDER_TYPE env var.
//
// Example:
//   @Injectable()
//   export class AcmeProviderAdapter implements ProviderAdapter { ... }
//
// ──────────────────────────────────────────────────────────────────────────

export interface ProviderAdapter {
  /**
   * Allocate a new eSIM for the given offer.
   * Returns the ICCID, LPA activation code, and expiry date.
   */
  createEsim(dto: CreateEsimDto): Promise<CreateEsimResponse>;

  /**
   * Poll the provider for the current activation status of an eSIM.
   * Called by ActivationService after createEsim to confirm the SIM is live.
   */
  getStatus(iccid: string): Promise<ProviderStatusResponse>;

  /**
   * Cancel an eSIM before it has been activated.
   */
  cancelEsim(iccid: string): Promise<void>;

  /**
   * Deactivate an already-active eSIM.
   */
  deactivateEsim(iccid: string): Promise<void>;

  /**
   * Add data to an existing active eSIM (top-up).
   */
  topupEsim(iccid: string, offerId: string): Promise<TopupEsimResponse>;
}
