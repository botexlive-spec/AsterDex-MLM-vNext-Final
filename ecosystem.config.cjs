/**
 * PM2 Ecosystem Configuration
 *
 * This file configures PM2 to run the daily ROI distribution script
 * on a schedule (cron job).
 *
 * Usage:
 *   pm2 start ecosystem.config.cjs
 *   pm2 save
 *   pm2 startup
 *
 * To stop:
 *   pm2 stop roi-distribution
 *   pm2 delete roi-distribution
 */

module.exports = {
  apps: [
    {
      name: 'roi-distribution',
      script: './scripts/distribute-daily-roi.js',

      // Run as a cron job (daily at 2:00 AM)
      cron_restart: '0 2 * * *',

      // Don't run on startup, only on cron schedule
      autorestart: false,

      // Watch for file changes (useful during development)
      watch: false,

      // Maximum memory allowed (restart if exceeded)
      max_memory_restart: '200M',

      // Environment variables
      env: {
        NODE_ENV: 'production',
        TZ: 'UTC'  // Use UTC timezone for consistency
      },

      // Logging configuration
      error_file: './logs/roi-distribution-error.log',
      out_file: './logs/roi-distribution-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,

      // Process management
      instances: 1,
      exec_mode: 'fork',

      // Auto-restart settings
      min_uptime: '10s',
      max_restarts: 3,

      // Kill timeout
      kill_timeout: 5000,

      // Wait time before restart
      restart_delay: 4000,

      // Script information
      args: '',
      node_args: '',

      // Interpreter
      interpreter: 'node',
      interpreter_args: ''
    }
  ]
};
