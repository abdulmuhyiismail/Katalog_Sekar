module.exports = {
  apps: [
    {
      name: "katalog-sekar-api",
      cwd: __dirname,
      script: "src/index.js",
      instances: 1,
      exec_mode: "fork",
      env_production: {
        NODE_ENV: "production",
      },
    },
  ],
};
