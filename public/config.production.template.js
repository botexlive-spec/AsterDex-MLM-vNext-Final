// ================================================================================
// FINASTER MLM PLATFORM - PRODUCTION RUNTIME CONFIGURATION
// ================================================================================
//
// This file contains runtime configuration that can be changed without rebuilding.
// Copy this file to public/config.js and fill in your production values.
//
// IMPORTANT:
// - This file is loaded at runtime (not build time)
// - Changes take effect immediately after page refresh
// - Safe to include public API keys (like Supabase anon key)
// - Never include secret keys (like service_role key)
//
// ================================================================================

window.__RUNTIME_CONFIG__ = {
  // ============================================================================
  // DATABASE CONFIGURATION (REQUIRED)
  // ============================================================================

  "VITE_SUPABASE_URL": "https://your-project.supabase.co",
  "VITE_SUPABASE_ANON_KEY": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",

  // ============================================================================
  // ORDERLY NETWORK CONFIGURATION
  // ============================================================================

  // Broker Configuration
  "VITE_ORDERLY_BROKER_ID": "your_broker_id",
  "VITE_ORDERLY_BROKER_NAME": "finaster",

  // Network Configuration
  "VITE_DISABLE_MAINNET": "false",
  "VITE_DISABLE_TESTNET": "true",

  // Supported Chains
  // Mainnet: Ethereum(1), BSC(56), zkSync(1329), Avalanche(43114), Base(8453), Arbitrum(42161), etc.
  "VITE_ORDERLY_MAINNET_CHAINS": "1,56,1329,43114,146,900900900,80094,1514,42161,8453,2818,98866,2741,34443,5000,10",

  // Testnet: BSC Testnet(97), Arbitrum Sepolia(421614), etc.
  "VITE_ORDERLY_TESTNET_CHAINS": "97,901901901,421614,11124",

  // Default Chain (56 = BSC Mainnet, 97 = BSC Testnet)
  "VITE_DEFAULT_CHAIN": "56",

  // ============================================================================
  // PRIVY AUTHENTICATION (OPTIONAL)
  // ============================================================================

  "VITE_PRIVY_APP_ID": "your_privy_app_id",
  "VITE_PRIVY_LOGIN_METHODS": "email,google",
  "VITE_PRIVY_TERMS_OF_USE": "https://yourdomain.com/terms",

  // ============================================================================
  // WALLET CONFIGURATION
  // ============================================================================

  "VITE_WALLETCONNECT_PROJECT_ID": "your_walletconnect_project_id",
  "VITE_ENABLE_ABSTRACT_WALLET": "true",
  "VITE_DISABLE_EVM_WALLETS": "false",
  "VITE_DISABLE_SOLANA_WALLETS": "false",

  // ============================================================================
  // BRANDING & APPLICATION INFO
  // ============================================================================

  "VITE_APP_NAME": "finaster",
  "VITE_APP_DESCRIPTION": "Professional MLM Platform with Integrated DEX Trading. Join our 30-level referral system and trade with up to 100x leverage.",

  // Logo Configuration
  "VITE_HAS_PRIMARY_LOGO": "true",
  "VITE_HAS_SECONDARY_LOGO": "true",

  // ============================================================================
  // NAVIGATION & MENUS
  // ============================================================================

  // Enabled Menu Items (comma-separated)
  // Available: Trading, Swap, Markets, Portfolio, Leaderboard, Rewards, Vaults
  "VITE_ENABLED_MENUS": "Trading,Swap,Markets,Portfolio,Leaderboard,Rewards,Vaults",

  // Custom Menu Items (format: "Label, URL")
  // Example: "Admin Panel, https://yourdomain.com/admin"
  "VITE_CUSTOM_MENUS": "",

  // ============================================================================
  // FEATURE FLAGS
  // ============================================================================

  "VITE_ENABLE_CAMPAIGNS": "true",

  // ============================================================================
  // SOCIAL MEDIA LINKS
  // ============================================================================

  "VITE_TELEGRAM_URL": "https://t.me/YourChannel",
  "VITE_DISCORD_URL": "https://discord.gg/YourServer",
  "VITE_TWITTER_URL": "https://twitter.com/YourHandle",

  // ============================================================================
  // SEO CONFIGURATION
  // ============================================================================

  "VITE_SEO_SITE_NAME": "Finaster - Professional MLM & Trading Platform",
  "VITE_SEO_SITE_DESCRIPTION": "Join Finaster for advanced MLM networking and professional cryptocurrency trading. Earn commissions through 30-level referral system and trade with up to 100x leverage.",
  "VITE_SEO_SITE_URL": "https://yourdomain.com",
  "VITE_SEO_SITE_LANGUAGE": "en",
  "VITE_SEO_SITE_LOCALE": "en_US",
  "VITE_SEO_TWITTER_HANDLE": "@YourTwitterHandle",
  "VITE_SEO_THEME_COLOR": "#6523c7",
  "VITE_SEO_KEYWORDS": "MLM platform, network marketing, crypto trading, perpetual DEX, referral system, commission tracking, passive income, cryptocurrency exchange, 30-level MLM, binary tree, ROI system",

  // ============================================================================
  // LOCALIZATION
  // ============================================================================

  // Available Languages (comma-separated)
  // Options: en, es, fr, de, zh, ja, ko, pt, ru, ar
  "VITE_AVAILABLE_LANGUAGES": "en",

  // ============================================================================
  // CUSTOM FEATURES
  // ============================================================================

  // Custom PNL Posters
  "VITE_USE_CUSTOM_PNL_POSTERS": "false",
  "VITE_CUSTOM_PNL_POSTER_COUNT": "0",

  // TradingView Customization (JSON string)
  "VITE_TRADING_VIEW_COLOR_CONFIG": ""
};

// ================================================================================
// ENVIRONMENT-SPECIFIC OVERRIDES
// ================================================================================

// Detect environment and apply overrides
(function() {
  const hostname = window.location.hostname;

  // Development/Localhost
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    console.log('🔧 Running in DEVELOPMENT mode');
    // No overrides needed - use config.js as-is
  }

  // Staging Environment
  else if (hostname.includes('staging') || hostname.includes('test')) {
    console.log('🧪 Running in STAGING mode');
    window.__RUNTIME_CONFIG__['VITE_DISABLE_TESTNET'] = 'false';
    window.__RUNTIME_CONFIG__['VITE_DEFAULT_CHAIN'] = '97'; // BSC Testnet
  }

  // Production Environment
  else {
    console.log('🚀 Running in PRODUCTION mode');
    window.__RUNTIME_CONFIG__['VITE_DISABLE_TESTNET'] = 'true';
    window.__RUNTIME_CONFIG__['VITE_DISABLE_MAINNET'] = 'false';
    window.__RUNTIME_CONFIG__['VITE_DEFAULT_CHAIN'] = '56'; // BSC Mainnet
  }

  console.log('✅ Runtime configuration loaded:', {
    environment: hostname,
    supabaseConfigured: !!window.__RUNTIME_CONFIG__['VITE_SUPABASE_URL'],
    brokerConfigured: !!window.__RUNTIME_CONFIG__['VITE_ORDERLY_BROKER_ID']
  });
})();
