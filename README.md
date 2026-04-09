# debateloop

`debateloop` is a terminal CLI for running structured model-vs-model debates on top of your local OpenCode setup.

It runs a fixed debate loop:

1. Debater A opening answer
2. Debater B opening answer
3. Debater A critique of B
4. Debater B critique of A
5. Debater A revised answer
6. Debater B revised answer
7. Judge verdict

The result is a winner-first summary plus a saved transcript you can inspect later.

## Requirements

- Node.js `>=20.12.0`
- OpenCode installed and working locally
- At least three available models in OpenCode:
  - one for Debater A
  - one for Debater B
  - one for the Judge

## Install

### From npm

```bash
npm install -g debateloop
```

### From a local checkout

```bash
npm install
npm run build
npm link
```

## Usage

Start a debate:

```bash
debateloop ask "Perche' TypeScript e' meglio di JavaScript?"
```

Override the models for one run:

```bash
debateloop ask "Meglio microservizi o monolite?" \
  --debater-a github-copilot/claude-sonnet-4.6 \
  --debater-b github-copilot/gpt-5.4 \
  --judge github-copilot/claude-haiku-4.5
```

Show every model output as each stage completes:

```bash
debateloop ask "Quando il clean code peggiora una codebase?" --debug
```

Inspect a saved transcript:

```bash
debateloop inspect <run-id>
```

## First Run

On the first run, `debateloop` asks you to choose:

- Debater A model
- Debater B model
- Judge model

It saves this config under:

```text
~/.config/debateloop/config.json
```

Saved transcripts live under:

```text
~/.config/debateloop/runs/
```

## How It Behaves

- opening answers are generated independently before critique begins
- retries are applied conservatively for transient stage failures
- judge output is validated as structured JSON
- partial transcripts are preserved when a run fails
- `inspect` shows prompts, outputs, attempts, durations, and stage errors

## Development

Install dependencies:

```bash
npm install
```

Run the CLI in dev mode:

```bash
npm run dev -- ask "Should tests come first?"
```

Run tests:

```bash
npm test
```

Build:

```bash
npm run build
```

## Notes

- `debateloop` depends on your local OpenCode configuration and available providers/models
- different judge models may produce longer or more verbose verdicts; transcripts preserve the raw output for inspection
- this project is optimized for structured comparison and tradeoff analysis, not open-ended agentic planning
