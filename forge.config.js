module.exports = {
    publishers: [
      {
        name: '@electron-forge/publisher-github',
        config: {
          repository: {
            owner: 'mrpiper21',
            name: 'Agent-Releases'
          },
          prerelease: false,
          draft: true
        }
      }
    ]
  }