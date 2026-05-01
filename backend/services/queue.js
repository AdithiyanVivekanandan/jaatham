/**
 * queue.js — BullMQ-based job queue for async PDF generation
 * 
 * Migrated from Bull to BullMQ v5 to fix CVE in uuid dependency (GHSA-w5hq-g745-h8pq).
 * BullMQ is the actively maintained successor to Bull.
 */
const { Queue, Worker } = require('bullmq');
const { generateAstrologerPDF } = require('./pdf');
const MatchResult = require('../models/MatchResult');
const Profile = require('../models/Profile');
const { auditLog } = require('../middleware/auditLogger');

const connection = {
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  // If REDIS_URL is provided (e.g., from Railway), parse it
  ...(process.env.REDIS_URL ? (() => {
    try {
      const u = new URL(process.env.REDIS_URL);
      return { host: u.hostname, port: parseInt(u.port || '6379'), password: u.password || undefined };
    } catch { return {}; }
  })() : {})
};

// Create queue
const pdfQueue = new Queue('pdf-generation', {
  connection,
  defaultJobOptions: {
    attempts: 3,          // Retry up to 3 times
    backoff: { type: 'exponential', delay: 2000 }, // 2s, 4s, 8s
    removeOnComplete: 100, // Keep last 100 completed jobs
    removeOnFail: 50,      // Keep last 50 failed jobs
  }
});

// Create worker (processes PDF jobs)
// Guard: skip worker setup if Redis not available (graceful degradation in dev)
let pdfWorker;
try {
  pdfWorker = new Worker('pdf-generation', async (job) => {
    const { matchId } = job.data;
    auditLog({ event: 'PDF_JOB_START', matchId, jobId: job.id });

    const match = await MatchResult.findById(matchId)
      .populate('profileA')
      .populate('profileB');

    if (!match) {
      throw new Error(`Match ${matchId} not found`);
    }

    const filePath = await generateAstrologerPDF(matchId, match.profileA, match.profileB, match);
    auditLog({ event: 'PDF_JOB_COMPLETE', matchId, jobId: job.id });
    return { filePath };
  }, {
    connection,
    concurrency: 2, // Max 2 PDFs generating simultaneously
  });

  pdfWorker.on('failed', (job, err) => {
    auditLog({ event: 'PDF_JOB_FAILED', matchId: job?.data?.matchId, error: err.message?.slice(0, 200) });
  });
} catch (err) {
  // Redis not available — PDF generation will fail gracefully
  auditLog({ event: 'QUEUE_INIT_FAILED', error: err.message?.slice(0, 100) });
}

pdfQueue.on('error', (err) => {
  auditLog({ event: 'QUEUE_ERROR', error: err.message?.slice(0, 100) });
});

module.exports = { pdfQueue };
