import { containsTerm, normalize, tokens } from '../shared/text.js'
import { isRemoteWish, matchPlace } from './locations.js'
import { cosine } from './vectors.js'

// Score d'une offre face au profil : une somme pondérée de critères, chacun expliqué à l'utilisateur.
// Fonction pure : aucune I/O, testable avec des vecteurs factices.

export type Verdict = 'ok' | 'partial' | 'ko' | 'unknown'
export interface MatchReason {
  key: string
  label: string
  verdict: Verdict
  detail: string
}
export interface MatchResult {
  score: number
  excluded: boolean
  reasons: MatchReason[]
}

export type WishedSeniority = 'junior' | 'mid' | 'senior' | 'lead'

export interface FeedbackSignal {
  centroid: Float32Array
  count: number
}

export interface ProfileSignals {
  targetTitles: string[]
  targetVectors: Float32Array[]
  profileVector?: Float32Array
  skills: string[]
  locations: string[]
  remote: 'any' | 'hybrid' | 'full'
  contractTypes: string[]
  salaryMin?: number | null
  seniority?: WishedSeniority | null
  excludedKeywords: string[]
  excludedCompanies: string[]
  liked?: FeedbackSignal
  rejected?: FeedbackSignal
}

export interface OfferSignals {
  title: string
  company: string
  location: string
  description: string
  contractType?: string | null
  remoteType?: string | null
  seniority?: string | null
  salaryMin?: number | null
  salaryMax?: number | null
  titleVector?: Float32Array
  textVector?: Float32Array
}

// value : 0 à 1 ; null = information absente de l'offre (compté neutre) ; undefined = critère sans objet
interface Criterion {
  weight: number
  value: number | null | undefined
  reason?: MatchReason
}

// Les similarités e5 sont tassées : on les étale sur 0–1. Bornes mesurées sur de vraies offres
// (profil dev React face à 53 offres de dev et 63 de comptabilité) : un métier sans rapport plafonne
// vers 0,84 pour l'intitulé et 0,83 pour le texte, un métier proche démarre juste au-dessus.
const CALIBRATION = { title: [0.835, 0.895], profile: [0.83, 0.885], feedback: 0.04 } as const
const spread = (similarity: number, [low, high]: readonly [number, number]): number =>
  Math.min(1, Math.max(0, (similarity - low) / (high - low)))

const verdictOf = (value: number): Verdict => (value >= 0.7 ? 'ok' : value >= 0.35 ? 'partial' : 'ko')
const reason = (key: string, label: string, verdict: Verdict, detail: string): MatchReason => ({
  key,
  label,
  verdict,
  detail,
})

function titleCriterion(profile: ProfileSignals, offer: OfferSignals): Criterion {
  if (profile.targetTitles.length === 0) return { weight: 35, value: undefined }
  const offerTokens = new Set(tokens(offer.title))
  let best = { value: 0, title: profile.targetTitles[0] }
  profile.targetTitles.forEach((target, i) => {
    const vector = profile.targetVectors[i]
    const semantic = offer.titleVector && vector ? spread(cosine(offer.titleVector, vector), CALIBRATION.title) : 0
    const wanted = tokens(target)
    const shared = wanted.filter(t => offerTokens.has(t)).length / Math.max(1, wanted.length)
    const lexical = shared === 1 ? 0.95 : shared >= 0.5 ? 0.6 : 0
    const value = Math.max(semantic, lexical)
    if (value > best.value) best = { value, title: target }
  })
  const detail = best.value >= 0.35 ? `Proche de « ${best.title} »` : 'Éloigné des métiers que tu vises'
  return { weight: 35, value: best.value, reason: reason('title', 'Métier', verdictOf(best.value), detail) }
}

function profileCriterion(profile: ProfileSignals, offer: OfferSignals): Criterion {
  if (!profile.profileVector || !offer.textVector) return { weight: 15, value: undefined }
  const value = spread(cosine(offer.textVector, profile.profileVector), CALIBRATION.profile)
  const detail =
    value >= 0.7
      ? 'Le poste ressemble à ton parcours'
      : value >= 0.35
        ? 'Recoupe en partie ton parcours'
        : 'Peu de rapport avec ton parcours'
  return { weight: 15, value, reason: reason('profile', 'Parcours', verdictOf(value), detail) }
}

function skillsCriterion(profile: ProfileSignals, offer: OfferSignals): Criterion {
  if (profile.skills.length === 0) return { weight: 15, value: undefined }
  const text = normalize(`${offer.title}\n${offer.description}`)
  const found = profile.skills.filter(skill => containsTerm(text, skill))
  if (found.length === 0 && !offer.description) {
    return { weight: 15, value: null, reason: reason('skills', 'Compétences', 'unknown', 'Description indisponible') }
  }
  // Une offre cite rarement plus de 3 ou 4 compétences d'un profil : au-delà, c'est déjà un très bon signe
  const expected = Math.min(profile.skills.length, 4)
  const value = Math.min(1, found.length / expected)
  const verdict: Verdict = found.length === 0 ? 'ko' : found.length >= expected / 2 ? 'ok' : 'partial'
  const detail =
    found.length > 0
      ? `Mentionne ${found.slice(0, 4).join(', ')}${found.length > 4 ? '…' : ''}`
      : 'Aucune de tes compétences citée'
  return { weight: 15, value, reason: reason('skills', 'Compétences', verdict, detail) }
}

function locationCriterion(profile: ProfileSignals, offer: OfferSignals): Criterion {
  const places = profile.locations.filter(p => !isRemoteWish(p))
  const wantsRemote = profile.remote === 'full' || profile.locations.some(isRemoteWish)
  if (places.length === 0 && !wantsRemote) return { weight: 10, value: undefined }
  const make = (value: number | null, verdict: Verdict, detail: string): Criterion => ({
    weight: 10,
    value,
    reason: reason('location', 'Lieu', verdict, detail),
  })
  if (offer.remoteType === 'full') return make(1, 'ok', 'Télétravail complet')
  if (profile.remote === 'full')
    return make(
      offer.remoteType === 'hybrid' ? 0.4 : 0,
      offer.remoteType ? 'partial' : 'ko',
      'Pas en télétravail complet',
    )
  if (!offer.location) return make(null, 'unknown', 'Lieu non précisé')
  const place = matchPlace(offer.location, places)
  if (place?.level === 'city') return make(1, 'ok', offer.location)
  if (place?.level === 'department') return make(0.75, 'ok', `${offer.location}, près de ${place.place}`)
  return make(0, 'ko', `${offer.location}, hors de tes zones`)
}

function contractCriterion(profile: ProfileSignals, offer: OfferSignals): Criterion {
  if (profile.contractTypes.length === 0) return { weight: 10, value: undefined }
  if (!offer.contractType)
    return { weight: 10, value: null, reason: reason('contract', 'Contrat', 'unknown', 'Type de contrat non précisé') }
  const ok = profile.contractTypes.some(c => normalize(c) === normalize(offer.contractType ?? ''))
  return { weight: 10, value: ok ? 1 : 0, reason: reason('contract', 'Contrat', ok ? 'ok' : 'ko', offer.contractType) }
}

function salaryCriterion(profile: ProfileSignals, offer: OfferSignals): Criterion {
  if (!profile.salaryMin) return { weight: 5, value: undefined }
  const offered = offer.salaryMax ?? offer.salaryMin
  if (!offered) return { weight: 5, value: null, reason: reason('salary', 'Salaire', 'unknown', 'Salaire non publié') }
  const ratio = offered / profile.salaryMin
  const value = ratio >= 1 ? 1 : ratio >= 0.85 ? 0.5 : 0
  const detail = `Jusqu'à ${Math.round(offered / 1000)} k€ par an`
  return {
    weight: 5,
    value,
    reason: reason('salary', 'Salaire', value === 1 ? 'ok' : value > 0 ? 'partial' : 'ko', detail),
  }
}

const LEVELS: Record<string, number> = { intern: -1, apprentice: -1, junior: 0, mid: 1, senior: 2, lead: 3 }
const LEVEL_LABELS: Record<string, string> = {
  intern: 'Stage',
  apprentice: 'Alternance',
  junior: 'Junior',
  mid: 'Confirmé',
  senior: 'Senior',
  lead: 'Lead / direction',
}

function seniorityCriterion(profile: ProfileSignals, offer: OfferSignals): Criterion {
  if (!profile.seniority) return { weight: 10, value: undefined }
  if (!offer.seniority)
    return { weight: 10, value: null, reason: reason('seniority', 'Niveau', 'unknown', 'Niveau non précisé') }
  const gap = Math.abs(LEVELS[offer.seniority] - LEVELS[profile.seniority])
  const value = gap === 0 ? 1 : gap === 1 ? 0.5 : 0
  const verdict: Verdict = value === 1 ? 'ok' : value > 0 ? 'partial' : 'ko'
  return {
    weight: 10,
    value,
    reason: reason('seniority', 'Niveau', verdict, LEVEL_LABELS[offer.seniority] ?? offer.seniority),
  }
}

// Ajustement appris de tes retours : proximité avec tes favoris, éloignement de tes rejets (Rocchio)
function feedbackAdjustment(profile: ProfileSignals, offer: OfferSignals): { points: number; reason?: MatchReason } {
  if (!offer.textVector) return { points: 0 }
  const confidence = (signal?: FeedbackSignal) => (signal && signal.count >= 2 ? Math.min(1, signal.count / 8) : 0)
  const likedConf = confidence(profile.liked)
  const rejectedConf = confidence(profile.rejected)
  const simLiked = likedConf && profile.liked ? cosine(offer.textVector, profile.liked.centroid) : 0
  const simRejected = rejectedConf && profile.rejected ? cosine(offer.textVector, profile.rejected.centroid) : 0
  let delta = 0
  if (likedConf && rejectedConf) delta = (simLiked - simRejected) / CALIBRATION.feedback
  else if (likedConf) delta = Math.max(0, (simLiked - 0.86) / CALIBRATION.feedback)
  else if (rejectedConf) delta = -Math.max(0, (simRejected - 0.86) / CALIBRATION.feedback)
  const points = Math.round(Math.max(-1, Math.min(1, delta)) * 12 * Math.max(likedConf, rejectedConf))
  if (Math.abs(points) < 3) return { points: 0 }
  const detail = points > 0 ? 'Ressemble aux offres que tu as gardées' : 'Ressemble aux offres que tu as écartées'
  return { points, reason: reason('feedback', 'Tes retours', points > 0 ? 'ok' : 'ko', detail) }
}

function exclusionReason(profile: ProfileSignals, offer: OfferSignals): MatchReason | undefined {
  const title = normalize(offer.title)
  const keyword = profile.excludedKeywords.find(k => containsTerm(title, k))
  if (keyword) return reason('excluded', 'Exclue', 'ko', `L'intitulé contient « ${keyword} »`)
  const company = profile.excludedCompanies.find(c => normalize(offer.company).includes(normalize(c)))
  return company ? reason('excluded', 'Exclue', 'ko', `Entreprise exclue : ${company}`) : undefined
}

const CRITERIA = [
  titleCriterion,
  profileCriterion,
  skillsCriterion,
  locationCriterion,
  contractCriterion,
  salaryCriterion,
  seniorityCriterion,
]

export function scoreOffer(profile: ProfileSignals, offer: OfferSignals): MatchResult {
  const excluded = exclusionReason(profile, offer)
  if (excluded) return { score: 0, excluded: true, reasons: [excluded] }
  const criteria = CRITERIA.map(criterion => criterion(profile, offer)).filter(c => c.value !== undefined)
  const totalWeight = criteria.reduce((sum, c) => sum + c.weight, 0)
  const base = totalWeight > 0 ? criteria.reduce((sum, c) => sum + c.weight * (c.value ?? 0.5), 0) / totalWeight : 0.5
  const feedback = feedbackAdjustment(profile, offer)
  const reasons = [
    ...criteria.flatMap(c => (c.reason ? [c.reason] : [])),
    ...(feedback.reason ? [feedback.reason] : []),
  ]
  return { score: Math.max(0, Math.min(100, Math.round(base * 100) + feedback.points)), excluded: false, reasons }
}
