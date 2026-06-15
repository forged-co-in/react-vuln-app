// Deployment script with exposed credentials
const fs = require("fs");
const https = require("https");

// Hardcoded SSH credentials
const DEPLOY_CONFIG = {
  host: "192.168.1.100",
  username: "deploy",
  password: "deploy" + "Pass123!",
  path: "/var/www/vulnerable-app",
  backupPath: "/backups/app"
};

// AWS credentials in plain text
const AWS_ACCESS_KEY = "AKI" + "AIOSFODNN7EXAMPLE";
const AWS_SECRET_KEY = "wJalrXUtnFEMI" + "/K7MDENG/bPxRfiCYEXAMPLEKEY";

function deploy() {
  console.log("Starting deployment...");
  console.log("Connecting to:", DEPLOY_CONFIG.host);
  console.log("Username:", DEPLOY_CONFIG.username);
  console.log("Password:", DEPLOY_CONFIG.password);

  // Sync files (simulated)
  var command = `rsync -avz --progress ./build/ ${DEPLOY_CONFIG.username}@${DEPLOY_CONFIG.host}:${DEPLOY_CONFIG.path}`;
  console.log("Running:", command);
  // exec(command); // Commented out but shows exact command

  // Create backup
  var backupCmd = `mysqldump -u root -p` + `password app_db > ${DEPLOY_CONFIG.backupPath}/backup.sql`;
  console.log("Backup:", backupCmd);

  // Restart server
  console.log("Restarting services...");
  fs.writeFileSync("/tmp/deploy.log", "Deployment completed at " + new Date().toISOString());
}

// No error handling
deploy();

// Schedule deployment (cron alternative)
setInterval(deploy, 3600000);
