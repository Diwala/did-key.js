import fs from 'fs';
import path from 'path';

import { Cipher } from '@transmute/did-key-cipher';

import { X25519KeyPair } from '../X25519KeyPair';
import { keypair, keyResolver } from '../__fixtures__';

const cipher = new Cipher(X25519KeyPair);
const document = { key1: 'value1', key2: 'value2' };

const WRITE_FIXTURE_TO_DISK = false;

it('can use json web key with did-key-cipher', async () => {
  const fixture: any = {
    jwe: [],
  };
  await Promise.all(
    keypair.map(async (kp: any) => {
      const recipients = [
        {
          header: {
            kid: kp.JsonWebKey2020.controller + kp.JsonWebKey2020.id,
            alg: 'ECDH-ES+A256KW',
          },
        },
      ];
      const jwe = await cipher.encryptObject({
        obj: { ...document },
        recipients,
        keyResolver,
      });
      expect(jwe.protected).toBeDefined();

      const keyAgreementKey = new X25519KeyPair({
        ...kp.JsonWebKey2020,
        id: kp.JsonWebKey2020.controller + kp.JsonWebKey2020.id,
      });
      const decryptedObject: any = await cipher.decryptObject({
        jwe,
        keyAgreementKey,
      });
      expect(decryptedObject).toEqual(document);
      fixture.jwe.push(jwe);
    })
  );
  // uncomment to debug
  // console.log(JSON.stringify(fixture, null, 2));
  if (WRITE_FIXTURE_TO_DISK) {
    fs.writeFileSync(
      path.resolve(__dirname, '../__fixtures__/did-key-cipher-jwe.json'),
      JSON.stringify(fixture, null, 2)
    );
  }
});
