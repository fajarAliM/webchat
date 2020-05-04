module.exports = {
  plugins: ['@babel/plugin-proposal-object-rest-spread'],
  presets: [
    [
      '@babel/preset-env',
      {
        targets: {
          browsers: ['last 2 versions']
        }
      }
    ],
    '@babel/preset-react'
  ]
};
