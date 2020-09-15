import crypto from 'crypto';

import * as keyUtils from './keyUtils';
import bs58 from 'bs58';
import secp256k1 from 'secp256k1';

const _generate = (secureRandom: any) => {
  let privateKey;
  do {
    privateKey = secureRandom();
  } while (!secp256k1.privateKeyVerify(privateKey));

  const publicKey = secp256k1.publicKeyCreate(privateKey);
  return { publicKey, privateKey };
};

export class Secp256k1KeyPair {
  public id: string;
  public type: string;
  public controller: string;

  public publicKeyBase58: string;
  public privateKeyBase58: string;

  static fingerprintFromPublicKey({ publicKeyBase58 }: any) {
    const pubkeyBytes = bs58.decode(publicKeyBase58);
    const buffer = new Uint8Array(2 + pubkeyBytes.length);
    // See https://github.com/multiformats/multicodec/blob/master/table.csv
    // 0xe7 is Secp256k1 public key
    buffer[0] = 0xe7; //
    buffer[1] = 0x01;
    buffer.set(pubkeyBytes, 2);
    // prefix with `z` to indicate multi-base base58btc encoding
    return `z${bs58.encode(buffer)}`;
  }

  static async generate(options: any = {}) {
    let privateKey;
    let publicKey;
    if (options.secureRandom) {
      ({ privateKey, publicKey } = _generate(options.secureRandom));
    }
    if (options.seed) {
      ({ privateKey, publicKey } = _generate(() => {
        return new Uint8Array(options.seed);
      }));
    }
    if (!privateKey) {
      throw new Error('Cannot generate private key.');
    }

    const publicKeyBase58 = keyUtils.publicKeyBase58FromPublicKeyHex(
      Buffer.from(publicKey).toString('hex')
    );
    const privateKeyBase58 = keyUtils.privateKeyBase58FromPrivateKeyHex(
      Buffer.from(privateKey).toString('hex')
    );

    const did = `did:key:${Secp256k1KeyPair.fingerprintFromPublicKey({
      publicKeyBase58,
    })}`;
    const keyId = `#${Secp256k1KeyPair.fingerprintFromPublicKey({
      publicKeyBase58,
    })}`;

    return new Secp256k1KeyPair({
      id: keyId,
      controller: did,
      publicKeyBase58,
      privateKeyBase58,
    });
  }

  static async from(options: any) {
    let privateKeyBase58 = options.privateKeyBase58;
    let publicKeyBase58 = options.publicKeyBase58;

    if (options.privateKeyHex) {
      privateKeyBase58 = await keyUtils.privateKeyBase58FromPrivateKeyHex(
        options.privateKeyHex
      );
    }

    if (options.publicKeyHex) {
      publicKeyBase58 = await keyUtils.publicKeyBase58FromPublicKeyHex(
        options.publicKeyHex
      );
    }

    if (options.privateKeyJwk) {
      privateKeyBase58 = keyUtils.privateKeyBase58FromPrivateKeyHex(
        await keyUtils.privateKeyHexFromJwk(options.privateKeyJwk)
      );
    }

    if (options.publicKeyJwk) {
      publicKeyBase58 = keyUtils.privateKeyBase58FromPrivateKeyHex(
        await keyUtils.publicKeyHexFromJwk(options.publicKeyJwk)
      );
    }

    return new Secp256k1KeyPair({
      ...options,
      privateKeyBase58,
      publicKeyBase58,
    });
  }

  static fromFingerprint({ fingerprint }: any) {
    // skip leading `z` that indicates base58 encoding
    const buffer = bs58.decode(fingerprint.substr(1));

    // https://github.com/multiformats/multicodec/blob/master/table.csv#L77
    if (buffer[0] === 0xe7 && buffer[1] === 0x01) {
      const publicKeyBase58 = bs58.encode(buffer.slice(2));
      const did = `did:key:${Secp256k1KeyPair.fingerprintFromPublicKey({
        publicKeyBase58,
      })}`;
      const keyId = `#${Secp256k1KeyPair.fingerprintFromPublicKey({
        publicKeyBase58,
      })}`;
      return new Secp256k1KeyPair({
        id: keyId,
        controller: did,
        publicKeyBase58,
      });
    }

    throw new Error(`Unsupported Fingerprint Type: ${fingerprint}`);
  }

  constructor(options: any = {}) {
    this.type = 'EcdsaSecp256k1VerificationKey2019';

    this.id = options.id;
    this.controller = options.controller;
    this.privateKeyBase58 = options.privateKeyBase58;
    this.publicKeyBase58 = options.publicKeyBase58;
  }

  get publicKey() {
    return this.publicKeyBase58;
  }

  get privateKey() {
    return this.privateKeyBase58;
  }

  signer() {
    if (!this.privateKeyBase58) {
      return {
        async sign() {
          throw new Error('No private key to sign with.');
        },
      };
    }
    let privateKeyBase58 = this.privateKeyBase58;
    return {
      async sign({ data }: any) {
        const messageHashUInt8Array = crypto
          .createHash('sha256')
          .update(data)
          .digest();
        const privateKeyUInt8Array = await keyUtils.privateKeyUInt8ArrayFromPrivateKeyBase58(
          privateKeyBase58
        );
        const sigObj: any = secp256k1.ecdsaSign(
          messageHashUInt8Array,
          privateKeyUInt8Array
        );

        return sigObj.signature;
      },
    };
  }

  verifier() {
    if (!this.publicKeyBase58) {
      return {
        async sign() {
          throw new Error('No public key to verify with.');
        },
      };
    }
    let publicKeyBase58 = this.publicKeyBase58;
    return {
      async verify({ data, signature }: any) {
        const messageHashUInt8Array = crypto
          .createHash('sha256')
          .update(data)
          .digest();

        const publicKeyUInt8Array = await keyUtils.publicKeyUInt8ArrayFromPublicKeyBase58(
          publicKeyBase58
        );

        let verified = false;
        try {
          verified = secp256k1.ecdsaVerify(
            signature,
            messageHashUInt8Array,
            publicKeyUInt8Array
          );
        } catch (e) {
          console.error('An error occurred when verifying signature: ', e);
        }
        return verified;
      },
    };
  }

  addEncodedPublicKey(publicKeyNode: any) {
    publicKeyNode.publicKeyBase58 = this.publicKeyBase58;
    return publicKeyNode;
  }

  fingerprint() {
    const { publicKeyBase58 } = this;
    return Secp256k1KeyPair.fingerprintFromPublicKey({ publicKeyBase58 });
  }

  verifyFingerprint(fingerprint: string) {
    // fingerprint should have `z` prefix indicating
    // that it's multi-base encoded
    if (!(typeof fingerprint === 'string' && fingerprint[0] === 'z')) {
      return {
        error: new Error('`fingerprint` must be a multibase encoded string.'),
        valid: false,
      };
    }
    let fingerprintBuffer;
    try {
      fingerprintBuffer = bs58.decode(fingerprint.slice(1));
    } catch (e) {
      return { error: e, valid: false };
    }
    let publicKeyBuffer;
    try {
      publicKeyBuffer = bs58.decode(this.publicKeyBase58);
    } catch (e) {
      return { error: e, valid: false };
    }

    // validate the first two multicodec bytes 0xe701
    const valid =
      fingerprintBuffer.slice(0, 2).toString('hex') === 'e701' &&
      publicKeyBuffer.equals(fingerprintBuffer.slice(2));
    if (!valid) {
      return {
        error: new Error('The fingerprint does not match the public key.'),
        valid: false,
      };
    }
    return { valid };
  }

  publicNode({ controller = this.controller } = {}) {
    const publicNode: any = {
      id: this.id,
      type: this.type,
    };
    if (controller) {
      publicNode.controller = controller;
    }
    this.addEncodedPublicKey(publicNode); // Subclass-specific
    return publicNode;
  }

  async toJwk(_private: boolean = false) {
    if (_private) {
      return keyUtils.privateKeyJwkFromPrivateKeyHex(
        bs58.decode(this.privateKeyBase58).toString('hex')
      );
    }
    return keyUtils.publicKeyJwkFromPublicKeyHex(
      bs58.decode(this.publicKeyBase58).toString('hex')
    );
  }

  async toHex(_private: boolean = false) {
    if (_private) {
      return keyUtils.privateKeyHexFromJwk(
        await keyUtils.privateKeyJwkFromPrivateKeyHex(
          bs58.decode(this.privateKeyBase58).toString('hex')
        )
      );
    }
    return keyUtils.publicKeyHexFromJwk(
      await keyUtils.publicKeyJwkFromPublicKeyHex(
        bs58.decode(this.publicKeyBase58).toString('hex')
      )
    );
  }

  toKeyPair(exportPrivate = false) {
    const kp: any = {
      id: this.id,
      type: this.type,
      controller: this.controller,
      publicKeyBase58: this.publicKeyBase58,
    };
    if (exportPrivate) {
      kp.privateKeyBase58 = this.privateKeyBase58;
    }
    return kp;
  }
}
