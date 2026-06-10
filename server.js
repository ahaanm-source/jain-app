import express from 'express';
import Anthropic from '@anthropic-ai/sdk';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));

const app = express();
app.use(express.json());

const DB_FILE = join(__dirname, 'recipes.json');

function readDB() {
  try { return JSON.parse(fs.readFileSync(DB_FILE, 'utf8')); }
  catch { return []; }
}

function writeDB(recipes) {
  fs.writeFileSync(DB_FILE, JSON.stringify(recipes, null, 2));
}

app.get('/api/recipes', (_req, res) => {
  res.json(readDB());
});

app.post('/api/recipes', (req, res) => {
  const { name, cuisine, mode, content } = req.body;
  if (!name || !mode || !content) return res.status(400).json({ error: 'missing fields' });
  const recipe = { id: Date.now(), name, cuisine: cuisine || 'Other', mode, content, saved_at: new Date().toISOString() };
  const recipes = [recipe, ...readDB()];
  writeDB(recipes);
  res.json(recipe);
});

app.delete('/api/recipes/:id', (req, res) => {
  const recipes = readDB().filter(r => String(r.id) !== req.params.id);
  writeDB(recipes);
  res.json({ ok: true });
});

const SYSTEM_PROMPTS = {
  jain: `You are a Jain cuisine expert. Convert the given recipe to a fully Jain-compliant version.

Jain dietary restrictions:
- No meat, poultry, fish, or seafood
- No eggs
- No root vegetables: onion, garlic, potato, sweet potato, carrot, radish, beet/beetroot, turnip, leek, scallion/green onion, shallot, fennel bulb, yam, taro

For each restricted ingredient, provide a Jain-friendly substitute that preserves the dish's flavor profile. If the user just gives a dish name, create a full Jain version of that dish from scratch.

Format your response as:
**[Dish Name] (Jain)**
**Cuisine:** [e.g. Indian, Italian, Mexican, Chinese, Japanese, Thai, Mediterranean, American, Middle Eastern, Other]
[One line on the key substitutions made]

**Ingredients**
- [ingredient + quantity]

**Instructions**
1. [step]
...`,

  vegan: `You are a vegan cuisine expert. Convert the given recipe to a fully vegan version.

Vegan restrictions — no animal products:
- No meat, poultry, fish, or seafood
- No eggs
- No dairy: milk, butter, ghee, cream, cheese, paneer, yogurt/curd
- No honey or other animal-derived ingredients

For each non-vegan ingredient, suggest a plant-based substitute that preserves texture and flavor. If the user just gives a dish name, create a full vegan version of that dish from scratch.

Format your response as:
**[Dish Name] (Vegan)**
**Cuisine:** [e.g. Indian, Italian, Mexican, Chinese, Japanese, Thai, Mediterranean, American, Middle Eastern, Other]
[One line on the key substitutions made]

**Ingredients**
- [ingredient + quantity]

**Instructions**
1. [step]
...`,

  both: `You are a Jain-vegan cuisine expert. Convert the given recipe to a version that is both fully Jain AND fully vegan.

Combined restrictions:
- No meat, poultry, fish, or seafood
- No eggs
- No dairy: milk, butter, ghee, cream, cheese, paneer, yogurt/curd
- No honey or other animal-derived ingredients
- No root vegetables: onion, garlic, potato, sweet potato, carrot, radish, beet/beetroot, turnip, leek, scallion/green onion, shallot, fennel bulb, yam, taro

For each restricted ingredient, suggest a Jain-vegan substitute that keeps the dish's essential character intact. If the user just gives a dish name, create a full Jain + Vegan version of that dish from scratch.

Format your response as:
**[Dish Name] (Jain + Vegan)**
**Cuisine:** [e.g. Indian, Italian, Mexican, Chinese, Japanese, Thai, Mediterranean, American, Middle Eastern, Other]
[One line on the key substitutions made]

**Ingredients**
- [ingredient + quantity]

**Instructions**
1. [step]
...`,
};

app.post('/api/convert', async (req, res) => {
  const { messages, mode } = req.body;

  if (!Array.isArray(messages) || messages.length === 0 || !SYSTEM_PROMPTS[mode]) {
    return res.status(400).json({ error: 'messages and mode are required' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY not set on server' });
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const client = new Anthropic({ apiKey });

  let ended = false;
  const end = (errMsg) => {
    if (ended) return;
    ended = true;
    if (errMsg) res.write(`data: ${JSON.stringify({ error: errMsg })}\n\n`);
    else res.write('data: [DONE]\n\n');
    res.end();
  };

  try {
    const stream = client.messages.stream({
      model: 'claude-opus-4-8',
      max_tokens: 2048,
      system: SYSTEM_PROMPTS[mode],
      messages,
    });

    stream.on('error', (err) => end(err.message));

    for await (const event of stream) {
      if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
        res.write(`data: ${JSON.stringify({ text: event.delta.text })}\n\n`);
      }
    }

    end();
  } catch (err) {
    end(err.message);
  }
});

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(join(__dirname, 'dist')));
  app.get('*', (_req, res) => res.sendFile(join(__dirname, 'dist', 'index.html')));
}

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`server running on http://localhost:${PORT}`));
