import { expose } from "comlink";
const USE_CORS = false;

export async function fetch_params() {
  const response = await fetch('http://localhost:3000/params.bin');
  const bytes = await response.arrayBuffer();
  const params = new Uint8Array(bytes);
  return params;
}

export async function fetch_pk() {
  const response = await fetch('http://localhost:3000/bench.pk');
  const bytes = await response.arrayBuffer();
  const pk = new Uint8Array(bytes);
  return pk;
}

export async function fetch_vk() {
  const response = await fetch('http://localhost:3000/bench.vk');
  const bytes = await response.arrayBuffer();
  const vk = new Uint8Array(bytes);
  return vk;
}
export const generateProof2048_1024 = async () => {
  console.log("Simple circuit proof");
  const params = await fetch_params();
  const pk = await fetch_pk();
  const vk = await fetch_vk();

  const {
    default: init,
    initThreadPool,
    // init_panic_hook,
    prove_pkcs1v15_2048_1024_circuit,
    verify_pkcs1v15_2048_1024_circuit,
    sample_rsa_private_key,
    generate_rsa_public_key,
    sign,
  } = await import("./wasm/halo2_rsa.js");

  console.log("number of threads", navigator.hardwareConcurrency);

  await init();
  // await init_panic_hook();
  await initThreadPool(4);
  const privateKey = await sample_rsa_private_key(2048);
  const msg = new Uint8Array([0]);
  const publicKey = await generate_rsa_public_key(privateKey);
  const signature = await sign(privateKey, msg);
  console.time("Full proving time");
  const proof = await prove_pkcs1v15_2048_1024_circuit(params, pk, publicKey, msg, signature);
  console.timeEnd("Full proving time");
  console.log("proof", proof);
  console.log(await verify_pkcs1v15_2048_1024_circuit(params, vk, proof));
};

const exports = {
  generateProof2048_1024
};
export type Halo2Prover = typeof exports;

expose(exports);

