import fs from 'fs';
import path from 'path';

import { Cipher } from '@transmute/did-key-cipher';

import { KeyPair } from '../KeyPair';
import { keypair } from '../__fixtures__/keypair.json';

const cipher = new Cipher(KeyPair);
const document = { key1: 'value1', key2: 'value2' };

const WRITE_FIXTURE_TO_DISK = false;

it('can generate did key cipher fixture', async () => {
  const fixture: any = {
    jwe: [],
  };
  await Promise.all(
    keypair.map(async kp => {
      const recipients = [
        {
          header: {
            kid: kp.toJwkPair.controller + kp.toJwkPair.id,
            alg: 'ECDH-ES+A256KW',
          },
        },
      ];
      const jwe = await cipher.encryptObject({
        obj: { ...document },
        recipients,
        keyResolver: (_uri: string) => {
          return kp.toJwkPair;
        },
      });
      expect(jwe.protected).toBeDefined();

      const keyAgreementKey = new KeyPair({
        ...kp.toJwkPair,
        id: kp.toJwkPair.controller + kp.toJwkPair.id,
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
