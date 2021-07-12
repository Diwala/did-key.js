# did:key

![CI](https://github.com/transmute-industries/did-key.js/workflows/CI/badge.svg) ![CD](https://github.com/transmute-industries/did-key.js/workflows/CD/badge.svg)

### [DID Key Method Specification](https://github.com/w3c-ccg/did-method-key)

`did:key` is a [DID Method](https://w3c.github.io/did-core/) which is offline friendly, cryptographically self certifying, requires no trust of blockchain or certificate authoritites and is ideal for ephemeral use.

🚧 Under Construction.

#### [https://did.key.transmute.industries](https://did.key.transmute.industries).

Because `did:key` is just a deterministic transformation of public key bytes
, you really ought to never resolve it over a network.

#### [did-key.js](./packages/did-key.js)

```
npm i @transmute/did-key.js@latest
```

This module contains all did-key implementations we current support.

Unless you really intend to use all of them, we suggest installing just the ones you need.

#### [Ed25519](./packages/did-key-ed25519)

`did:key:z6Mk...`

```
npm i @transmute/did-key-ed25519@latest --save
```

#### [X25519](./packages/did-key-x25519)

`did:key:z6LS...`

```
npm i @transmute/did-key-x25519@latest --save
```

#### [Bls12381](./packages/did-key-bls12381)

- `did:key:z5Tc...` -> G1 + G2
- `did:key:z3tE...` -> G1
- `did:key:zUC7...` -> G2

```
npm i @transmute/did-key-bls12381@latest --save
```

#### [Secp256k1](./packages/did-key-secp256k1)

`did:key:zQ3s...`

```
npm i @transmute/did-key-secp256k1@latest --save
```

#### [Secp256r1, Secp384r1, Secp521r1](./packages/did-key-web-crypto)

- `did:key:zDna...` -> Secp256r1 / P-256
- `did:key:z82L...` -> Secp384r1 / P-384
- `did:key:z2J9...` -> Secp521r1 / P-521

```
npm i @transmute/did-key-web-crypto@latest --save
```

## Release process

### Unstable releases

Unstable releases are automatic, from CD:

- On every commit to main an unstable release is pushed. An unstable release is a release with a tag of the form: vA.B.C-unstable.X. Everytime a PR is merged, X is incremented.
- If "skip-ci" is present in the commit message, the aforementioned behavior is skipped

### Stable releases

Stable releases are triggered by a dev locally

- Make sure you are familiar with [Semantic Versioning](https://semver.org/)
- Run `npm install` and `npm build` in the root level directory
- Run
  - `npm run publish:stable:patch` for a patch version increment
  - `npm run publish:stable:minor` for a minor version increment
  - `npm run publish:stable:major` for a major version increment

### Example

- Current version is v0.1.0
- A PR is made to fix bug A. When it's merged a release is made: v0.1.0-unstable-0
- A PR is made to add feature B. When it's merged a release is made: v0.1.0-unstable-1
- A PR is made to add feature C. When it's merged a release is made: v0.1.0-unstable-2
- Dev runs `npm run publish:stable:patch`. Current version is v0.1.0
- A PR is made to fix bug D. When it's merged a release is made: v0.1.1-unstable-0
- etc...

### Usage

To install all packages run

```bash
npm install
```

To install a specific package (and its dependencies) run

```bash
npm run install:only @transmute/did-key-x25519
```

To run tests in every packages run

```bash
npm run test
```

To test a specific package run

```bash
npm run test:only @transmute/did-key-x25519
```

### Alternatives

- [digitalbazaar/did-method-key-js](https://github.com/digitalbazaar/did-method-key-js)
- [digitalbazaar/crypto-ld](https://github.com/digitalbazaar/crypto-ld)
- [mattrglobal/bls12381-key-pair](https://github.com/mattrglobal/bls12381-key-pair)

<p align="center">
  <img src="./transmute-banner.png"/>
</p>

### License

```
Copyright 2020 Transmute Industries Inc.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
```
