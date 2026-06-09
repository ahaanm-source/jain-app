import express from 'express';
import Anthropic from '@anthropic-ai/sdk';
import Database from 'better-sqlite3';

const app = express();
app.use(express.json());

const db = new Database('recipes.db');
db.exec(`
  CREATE TABLE IF NOT EXISTS recipes (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    name      TEXT NOT NULL,
    cuisine   TEXT NOT NULL,
    mode      TEXT NOT NULL,
    content   TEXT NOT NULL,
    saved_at  TEXT NOT NULL
  )
`);

app.get('/api/recipes', (_req, res) => {
  const rows = db.prepare('SELECT * FROM recipes ORDER BY saved_at DESC').all();
  res.json(rows);
});

app.post('/api/recipes', (req, res) => {
  const { name, cuisine, mode, content } = req.body;
  if (!name || !mode || !content) return res.status(400).json({ error: 'missing fields' });
  const saved_at = new Date().toISOString();
  const result = db.prepare(
    'INSERT INTO recipes (name, cuisine, mode, content, saved_at) VALUES (?, ?, ?, ?, ?)'
  ).run(name, cuisine || 'Other', mode, content, saved_at);
  res.json({ id: result.lastInsertRowid, name, cuisine, mode, content, saved_at });
});

app.delete('/api/recipes/:id', (req, res) => {
  db.prepare('DELETE FROM recipes WHERE id = ?').run(req.params.id);
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

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`server running on http://localhost:${PORT}`));
