import { getJwkTypeFromMultibase } from './getJwkTypeFromMultibase';

import { keypair } from '../__fixtures__';

it('getJwkTypeFromMultibase', () => {
  const data = getJwkTypeFromMultibase(
    keypair[0].fromJwk.id.substring(keypair[0].fromJwk.id.indexOf('#') + 1)
  );
  expect(data).toEqual({
    kty: keypair[0].toJwkPair.publicKeyJwk.kty,
    crv: keypair[0].toJwkPair.publicKeyJwk.crv,
  });
});
