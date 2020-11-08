import React from "react";
import PropTypes from "prop-types";

import Base from "../base/base";
import { openDB } from 'idb';
import {KeyPair, createDetachedJws} from '@transmute/did-key-web-crypto'

import * as vcjs from "@transmute/vc.js";

import {
  JsonWebKey,
  JsonWebSignature,
} from "@transmute/json-web-signature-2020";
import credential from './credential.json'
import {documentLoader} from './documentLoader'
import { Typography } from "@material-ui/core";

const dbPromise = openDB('keyval-store', 1, {
  upgrade(db) {
    db.createObjectStore('keyval');
  },
});

const idbKeyval = {
  async get(key) {
    return (await dbPromise).get('keyval', key);
  },
  async set(key, val) {
    return (await dbPromise).put('keyval', val, key);
  },
  async delete(key) {
    return (await dbPromise).delete('keyval', key);
  },
  async clear() {
    return (await dbPromise).clear('keyval');
  },
  async keys() {
    return (await dbPromise).getAllKeys('keyval');
  },
};

export const Unextractable = () => {
  const [state, setState] = React.useState({})
  React.useEffect(()=>{
    (async ()=>{
      let usableKey  = await idbKeyval.get('myKey')

      if (usableKey === undefined){
        const algorithm = { name: 'ECDSA', namedCurve: 'P-256'}
        const extractable = false;
        // const keyUsages = ['encrypt', 'decrypt', 'sign', 'verify', 'deriveKey', 'deriveBits', 'deriveBits', 'wrapKey', 'unwrapKey'];
        const keyUsages = ['sign', 'verify'];
        const result = await crypto.subtle.generateKey(algorithm, extractable, keyUsages);
        try{
          await crypto.subtle.exportKey('jwk', result.privateKey)
        } catch(e){
          console.info('Expected Unextractable: ', e.message);
        }
        usableKey  = await idbKeyval.set('myKey', result)
      } else {
        // console.log(usableKey)
        // now we have a key to use...
      }

      const publicKeyJwk =  await crypto.subtle.exportKey('jwk', usableKey.publicKey)
      const keyJson = (await KeyPair.from({publicKeyJwk})).toJsonWebKeyPair(false)
      keyJson.id = keyJson.controller + keyJson.id;
      const keypair = await JsonWebKey.from(keyJson)
      
      keypair.signer = ()=> {
        return {
          sign: async ({data}) => {
            const signature = await crypto.subtle.sign(
              {
                name: 'ECDSA',
                hash: { name: 'SHA-256' },
              },
              usableKey.privateKey,
              data
            );
            return createDetachedJws({
              sign: async (data) => {
                const signature = await crypto.subtle.sign(
                  {
                    name: 'ECDSA',
                    hash: { name: 'SHA-256' },
                  },
                  usableKey.privateKey,
                  data
                );
                return signature;
              },
            }, data, { alg: 'ES256', b64: false, crit: ['b64'] });
          },
        }
      };

      const suite = new JsonWebSignature({
        key: keypair,
        date: credential.issuanceDate,
      });

      const verifiableCredential = await vcjs.ld.issue({
        credential: {
          ...credential,
          issuer: {
            ...credential.issuer,
            id: keypair.controller,
          },
        },
        suite,
        documentLoader: async (uri) => {
          const res = await documentLoader(uri);
          // uncomment to debug
          // console.log(res);
          return res;
        },
      });
      const verification = await vcjs.ld.verifyCredential({
        credential: { ...verifiableCredential },
        suite: new JsonWebSignature(),
        documentLoader: async (uri) => {
          const res = await documentLoader(uri);
          // uncomment to debug
          // console.log(res);
          return res;
        },
      });
      setState({
        keypair: keyJson,
        verified: verification.verified,
        verifiableCredential,
      })
    })()
  }, [])
  return (
    <Base>
    <Typography>
      A verifiable credential issued from an unextractable 
      (software isolated) private key, represented using did:key.
    </Typography>
      <pre>{JSON.stringify(state, null, 2 )}</pre>
    </Base>
  );
};

Unextractable.propTypes = {};
