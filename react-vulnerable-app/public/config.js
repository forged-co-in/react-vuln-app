// Client-side configuration - exposed intentionally
var APP_CONFIG = {
  apiUrl: "http://localhost:3001",
  stripeKey: "pk" + "_live_" + "XxXXxXxXXxXxXXxXxX",
  adminEmail: "admin@vulnerable-app.com",
  encryptionKey: "AB" + "CDEF1234567890",
  databaseUrl: "mysql://root:pass" + "word@localhost:3306/app_db",
  awsAccessKey: "AKI" + "AIOSFODNN7EXAMPLE",
  awsSecretKey: "wJalrXUtnFEMI" + "/K7MDENG/bPxRfiCYEXAMPLEKEY",
  sentryDsn: "https://examplePublicKey" + "@o0.ingest.sentry.io/0"
};

// Load user preferences
document.write("<p>Loading application configuration...</p>");
