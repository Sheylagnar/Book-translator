const apiKey =
  process.env.GEMINI_API_KEY?.trim() ||
  process.env.EXPO_PUBLIC_GOOGLE_AI_API_KEY?.trim()

if (!apiKey) {
  console.error(
    "Missing API key. Set GEMINI_API_KEY or EXPO_PUBLIC_GOOGLE_AI_API_KEY before running this script.",
  )
  process.exit(1)
}

const endpoint = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`

async function main() {
  const response = await fetch(endpoint)
  const payload = await response.json()

  if (!response.ok) {
    console.error(payload?.error?.message ?? "Failed to list Gemini models.")
    process.exit(1)
  }

  const models = (payload.models ?? [])
    .filter((model) => model.supportedGenerationMethods?.includes("generateContent"))
    .sort((a, b) => a.name.localeCompare(b.name))

  if (models.length === 0) {
    console.log("No models with generateContent support were returned for this API key.")
    return
  }

  for (const model of models) {
    const methods = model.supportedGenerationMethods?.join(", ") ?? "n/a"
    const baseModelId = model.baseModelId ? ` | baseModelId: ${model.baseModelId}` : ""
    console.log(`${model.name}${baseModelId} | methods: ${methods}`)
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error))
  process.exit(1)
})
