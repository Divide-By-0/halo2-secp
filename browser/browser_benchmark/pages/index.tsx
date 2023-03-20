import { useState, useEffect } from "react";

import { wrap } from "comlink";

const withProverApi = (worker: Worker) =>
  wrap<import("../lib/halo2Prover/halo2Prover").Halo2Prover>(worker);

export default function Home() {
  const [worker, setWorker] = useState<any>();

  useEffect(() => {
    const worker = new Worker(
      new URL("../lib/halo2Prover/halo2Prover", import.meta.url),
      {
        name: "halo-worker",
        type: "module"
      }
    );

    setWorker(worker);
  }, []);

  return (
    <div>
      <button
        onClick={async () => {
          if (worker) {
            await withProverApi(worker).generateProof2048_1024();
          }
        }}
      >
        prove (2048 bit public key, 1024 byte message)
      </button>
    </div>
  );
}
