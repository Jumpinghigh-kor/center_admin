module.exports = {
  apps: [
    // {
    //   /* 개발 환경용 서버 */
    //   name: "jumpinghigh-dev",
    //   script: "./server.js",
    //   instances: 1, // 단일 쓰레드
    //   autorestart: false,
    //   watch: false,
    //   env: {
    //     Server_PORT: 8080,
    //     NODE_ENV: "development",
    //   },
    // },
    {
      /* 배포 환경용 서버 */
      name: "jumpinghigh-product",
      script: "./server.js",
      instances: -1, // 클러스터 모드
      autorestart: false,
      watch: false,
      env: {
        Server_PORT: 22,
        NODE_ENV: "production",
      },
    },
  ],
};
