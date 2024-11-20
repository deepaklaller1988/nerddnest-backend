module.exports = {
    apps: [
      {
        name: "nerddnest-backend",
        script: "npm",
        args: "run start",
        env: {
          NODE_ENV: "development",
        },
      },
    ],
  };