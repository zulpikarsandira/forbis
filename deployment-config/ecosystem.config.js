module.exports = {
    apps: [
        {
            name: "forbis-cimanggung",
            script: "npm",
            args: "start",
            env: {
                PORT: 3000,
                NODE_ENV: "production",
            },
        },
    ],
};
