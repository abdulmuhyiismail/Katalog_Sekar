module.exports = {
  apps: [
    {
      name: "katalog-sekar-api",
      cwd: __dirname,
      script: "src/index.js",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      max_memory_restart: "300M",
      time: true,
      node_args: "--no-warnings",
      env_production: {
        NODE_ENV: "production",
      },
    },
  ],
};
