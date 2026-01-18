/**
 * IMAP Integration Module
 */

export {
  getOrgIMAPConfig,
  syncOrgEmails,
  testIMAPConnection,
  getCandidateEmailThread,
  matchEmailToCandidate,
  type IMAPConfig,
  type SyncedEmail,
  type SyncResult,
} from './imap-service'
