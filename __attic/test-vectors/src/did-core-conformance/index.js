module.exports = {
  ed25519: require('./ed25519'),
  x25519: require('./x25519'),
  secp256k1: require('./secp256k1'),
  ['bls12381_g1']: require('./bls12381_g1'),
  ['bls12381_g2']: require('./bls12381_g2'),
  ['bls12381_g1andg2']: require('./bls12381_g1andg2'),
  ['p-256']: require('./p-256'),
  ['p-384']: require('./p-384'),
  ['p-521']: require('./p-521'),
};
