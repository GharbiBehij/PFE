import { Injectable } from '@nestjs/common';
import { LedgerReason, LedgerType } from '@prisma/client';
import { WalletRepository } from './wallet.repository';

@Injectable()
export class WalletService {
      constructor(private readonly walletRepository: WalletRepository) { }

      async ReserveAmount(userId: number, transactionId: number, amount: number, paymentMethod: string) {
            return this.walletRepository.ReserveAmount(userId, transactionId, amount, paymentMethod);
      }

      async releaseReservedFunds(transactionId: number) {
            return this.walletRepository.releaseReservedFunds(transactionId);
      }

      async commitReservedFunds(transactionId: number) {
            return this.walletRepository.commitReservedFunds(transactionId);
      }

      async findUnique(transactionId: number) {
            return this.walletRepository.findUnique(transactionId);
      }

      async logLedger(walletId: number, amount: number, type: LedgerType, reason: LedgerReason, referenceId: number) {
            return this.walletRepository.logLedger(walletId, amount, type, reason, referenceId);
      }

      // ── BALANCE & HISTORY ────────────────────────────────────────────────────

      async getBalance(userId: number) {
            return this.walletRepository.getBalance(userId);
      }

      async getWalletHistory(userId: number, page: number, limit: number) {
            return this.walletRepository.getWalletHistory(userId, page, limit);
      }

      async getSalesmanTopUpHistory(salesmanId: number, page: number, limit: number) {
            return this.walletRepository.getSalesmanTopUpHistory(salesmanId, page, limit);
      }

      // ── TOP-UPS ─────────────────────────────────────────────────────────────

      async requestTopUp(salesmanId: number, amount: number) {
            return this.walletRepository.requestTopUp(salesmanId, amount);
      }

      async getPendingTopUps(page: number, limit: number) {
            return this.walletRepository.getPendingTopUps(page, limit);
      }

      async approveTopUp(topUpId: number, adminId: number) {
            return this.walletRepository.approveTopUp(topUpId, adminId);
      }

      async rejectTopUp(topUpId: number, adminId: number) {
            return this.walletRepository.rejectTopUp(topUpId, adminId);
      }
}