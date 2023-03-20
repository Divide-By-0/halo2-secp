import { useState, useEffect } from "react";
import Script from 'next/script'
import type Benchmark from "benchmark";
import { wrap } from "comlink";

const withProverApi = (worker: Worker) =>
  wrap<import("../lib/halo2Prover/halo2Prover").Halo2Prover>(worker);

declare global {
  interface Window {
    Benchmark: typeof Benchmark;
  }
}

const formatStats = (stats: any) => {
  let statsString = "";
  for (let k of ["mean", "deviation", "variance", "moe", "rme", "sem"]) {
    statsString += "  " + k + ": " + stats[k] + "\n";
  }
  statsString += "  Sample Size: " + stats.sample.length + "\n";
  statsString += "  Samples: " + stats.sample.join(", ") + "\n";
  return statsString;
};

export default function Home() {
  const [worker, setWorker] = useState<any>();
  const [isProcessing, setIsProcessing] = useState(false);
  const [minSamples, setMinSamples] = useState(1);

  const onMinSamplesChange = (e: any) => {
    setMinSamples(e.target.value);
  };

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
      <Script src="https://cdn.jsdelivr.net/npm/lodash" strategy="beforeInteractive"></Script>
      <Script src="https://cdn.jsdelivr.net/npm/platform" strategy="beforeInteractive"></Script>
      <Script src="https://cdn.jsdelivr.net/npm/benchmark" strategy="beforeInteractive"></Script>
      <label>
        min samples:
        <input type="number" value={minSamples} onChange={onMinSamplesChange} />
      </label>
      <button
        disabled={isProcessing}
        onClick={() => {
          // await withProverApi(worker).generateProofScalarMultFull();
          const finishedCallback = () => {
            console.log("Benchmarks completed.");
            setIsProcessing(false);
          };

          if (worker) {
            setIsProcessing(true);
            console.log("Running benchmarks...");

            // Benchmark.js Suite
            const suite = new window.Benchmark.Suite();
            suite
              .add("2048 bit public key, 1024 byte message", {
                defer: true,
                minSamples: minSamples, // set in the UI
                fn: async (deferred: any) => {
                  await withProverApi(worker).generateProof2048_1024();
                  deferred.resolve();
                }
              })
              .on("cycle", function (event: Event) {
                console.log(String(event.target));
              })
              .on("complete", function (this: any) {
                console.log("Fastest is " + (this).filter("fastest").map("name"));
                const statsString = formatStats(this[0].stats);
                console.log("Stats for: " + this[0].name + "\n" + statsString);
                console.log("Benchmarks completed.");

                // run on complete
                finishedCallback();

              })
              .run();
          }
        }}
      >
        benchmark: prove (scalar mult full)
      </button>
    </div>
  );
}
