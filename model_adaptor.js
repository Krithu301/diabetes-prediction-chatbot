import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';

const PYTHON_BIN = process.env.PYTHON_BIN || 'python';

// The correct model path (matches your backend folder structure)
const MODEL_PATH = path.join('src', 'model', 'pipeline.joblib');

// Helper function to run the Python runner
function runPythonRunner(pyPath, inputJson) {
  return new Promise((resolve, reject) => {
    const py = spawn(PYTHON_BIN, [pyPath], { env: process.env });

    let out = '';
    let err = '';

    py.stdin.write(inputJson);
    py.stdin.end();

    py.stdout.on('data', (c) => (out += c.toString()));
    py.stderr.on('data', (c) => (err += c.toString()));

    py.on('close', (code) => {
      if (code !== 0) {
        return reject(new Error(`Python runner failed (code ${code}): ${err}\n${out}`));
      }
      try {
        const parsed = JSON.parse(out);
        if (parsed && parsed.error) return reject(new Error(`Runner error: ${parsed.error}`));
        resolve(parsed);
      } catch (e) {
        reject(e);
      }
    });
  });
}

// Main export used by Node to call Python
export async function loadModelAndPredict(features) {
  try {
    // Ensure model file exists
    if (fs.existsSync(MODEL_PATH)) {
      const pyPath = path.join(process.cwd(), 'src', 'model_runner.py');
      const inp = JSON.stringify(features);

      try {
        // Try running with default Python
        const parsed = await runPythonRunner(pyPath, inp);
        return parsed;
      } catch (e) {
        // If python fails, retry with python3
        if (PYTHON_BIN === 'python') {
          try {
            process.env.PYTHON_BIN = 'python3';
            const parsed2 = await runPythonRunner(pyPath, inp);
            return parsed2;
          } catch (e2) {
            console.error('Tried python and python3, both failed', e2);
            throw e2;
          }
        }
        throw e;
      }
    } else {
      console.error(`Model not found at: ${MODEL_PATH}`);
    }
  } catch (e) {
    console.error('Model adaptor error:', e);
  }

  // Fallback (if model fails)
  const glucose = Number(features.glucose || 0);
  const bmi = Number(features.bmi || 0);
  const age = Number(features.age || 0);

  let score = 0;
  if (glucose > 125) score += 2;
  if (bmi >= 30) score += 2;
  if (age >= 45) score += 1;

  const prob = Math.min(0.95, 0.05 * score + 0.1);
  const label = prob > 0.4 ? 'Diabetes probable' : 'Low risk';
  const recommendation =
    prob > 0.4
      ? 'Consult a doctor, improve diet, exercise, and retest.'
      : 'Maintain a healthy lifestyle; retest periodically.';

  return { prob, label, recommendation };
}
