import path from 'node:path'
import { env, pipeline, type FeatureExtractionPipeline } from '@huggingface/transformers'
import { logger } from '../shared/logger.js'

// multilingual-e5-small (quantifié, ~118 Mo) : retenu après comparaison sur des intitulés français,
// il sépare mieux les métiers proches que des modèles 3 à 5 fois plus lourds (voir docs/matching.md).
export const MODEL_ID = 'Xenova/multilingual-e5-small'
const BATCH_SIZE = 16

env.cacheDir = process.env.MODELS_DIR || path.resolve('.models')

let extractor: Promise<FeatureExtractionPipeline> | undefined

const getExtractor = (): Promise<FeatureExtractionPipeline> => {
  extractor ??= (async () => {
    const started = Date.now()
    const loaded = await pipeline('feature-extraction', MODEL_ID, { dtype: 'q8' })
    logger.info(`Modèle d'embeddings chargé en ${Date.now() - started} ms`)
    return loaded
  })()
  return extractor
}

// e5 attend un préfixe : "query" pour ce qu'on cherche (profil), "passage" pour ce qu'on compare (offres)
export type EmbeddingRole = 'query' | 'passage'

export async function embed(texts: string[], role: EmbeddingRole): Promise<Float32Array[]> {
  const model = await getExtractor()
  const vectors: Float32Array[] = []
  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batch = texts.slice(i, i + BATCH_SIZE).map(t => `${role}: ${t}`)
    const output = await model(batch, { pooling: 'mean', normalize: true })
    const [rows, dims] = output.dims
    const data = output.data as Float32Array // pooling mean + normalize renvoie toujours des float32
    for (let r = 0; r < rows; r++) vectors.push(data.slice(r * dims, (r + 1) * dims))
  }
  return vectors
}

export const warmUpEmbeddings = (): void => {
  getExtractor().catch(err => logger.error({ err }, "Impossible de charger le modèle d'embeddings"))
}
