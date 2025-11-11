module.exports = {
    publishers: [
      {
        name: '@electron-forge/publisher-github',
        config: {
          repository: {
            owner: 'mrpiper21',
            name: 'piper-agent-prototype-Ts'
          },
          prerelease: false,
          draft: true
        }
      }
    ]
  }