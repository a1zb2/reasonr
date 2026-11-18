# Reasonr demo: watch it learn

Static Next.js site that shows how Qwen2.5-0.5B's answers to 8 GSM8K questions change across GRPO training checkpoints. See the [main README](../README.md) for the project.

```bash
npm install
npm run dev     # http://localhost:3000
npm run build   # static site in out/
```

- `data/` holds copies of `results/demo_samples.json`, `probe_log.json` and `results.json`. If you re-run training, copy the new files over.
- The "Before vs after" tab is built from `results/eval_outputs.csv` by `npm run data` (`scripts/build-eval-data.mjs`). It checks the fixed/broken counts, then writes `data/eval_curated.json` (15 hand-picked fixes, bundled) and `public/data/eval_pool.json` (all fixed + broken + 150 random, fetched on demand). The outputs are committed, so the Vercel build doesn't need the CSV. The curated row ids are listed at the top of the script.
- `lib/answer.ts` ports the notebook's answer extraction and format check, so the correct/wrong badges match how the model was scored. The data script imports the same file.
- Set `GITHUB_URL` in `lib/data.ts` to your repo.

Deploys on Vercel with the project's Root Directory set to `demo`.
