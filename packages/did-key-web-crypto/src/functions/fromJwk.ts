import { types } from '@transmute/did-key-cipher';
import { jwkToBase58 } from './jwkToBase58';
import { getMultibaseFromJwk } from './getMultibaseFromJwk';
import { fingerprintToDid } from './fingerprintToDid';

export const fromJwk = (jwk: any): types.LinkedDataKeyPair => {
  const id = getMultibaseFromJwk(jwk);
  const controller = fingerprintToDid(id);
  return {
    id: `#${id}`,
    type: 'JsonWebKey2020',
    controller,
    ...(jwkToBase58(jwk) as any),
  };
};
