import { Tag } from '../shared/ui/Tag'
import { Segmented } from '../shared/ui/Segmented'
import { TextField } from '../shared/ui/TextField'
import { ChipInput } from './ChipInput'
import { ProfileRow } from './ProfileRow'
import type { UpdatePreference } from './useProfile'
import {
  CONTRACT_TYPES,
  SENIORITY_LABELS,
  SENIORITY_VALUES,
  type ContractType,
  type ProfilePreferences,
  type RemotePreference,
  type Seniority,
} from './types'

export interface FieldProps {
  draft: ProfilePreferences
  update: UpdatePreference
}

const REMOTE_OPTIONS: { value: RemotePreference; label: string }[] = [
  { value: 'any', label: 'Peu importe' },
  { value: 'hybrid', label: 'Hybride' },
  { value: 'full', label: 'Télétravail complet' },
]

const SENIORITY_OPTIONS: { value: Seniority | 'none'; label: string }[] = [
  { value: 'none', label: 'Non précisé' },
  ...SENIORITY_VALUES.map(value => ({ value, label: SENIORITY_LABELS[value] })),
]

export const TitlesField = ({ draft, update }: FieldProps) => (
  <ProfileRow
    index={2}
    title="Métiers visés"
    hint="Le critère le plus important. Sert aussi aux recherches lancées pour ton profil."
  >
    <ChipInput
      label="Métiers visés"
      values={draft.targetTitles}
      onChange={v => update('targetTitles', v)}
      placeholder="Ex. Développeur React, Chef de projet digital"
    />
  </ProfileRow>
)

export const SkillsField = ({ draft, update }: FieldProps) => (
  <ProfileRow index={3} title="Compétences" hint="Repérées dans le texte des offres.">
    <ChipInput
      label="Compétences"
      values={draft.skills}
      onChange={v => update('skills', v)}
      placeholder="Ex. TypeScript, Figma, comptabilité fournisseurs"
    />
  </ProfileRow>
)

export const PlacesField = ({ draft, update }: FieldProps) => (
  <ProfileRow index={4} title="Lieux" hint="Villes, départements (69) ou régions. Les villes voisines comptent aussi.">
    <div className="space-y-4">
      <ChipInput
        label="Lieux"
        values={draft.locations}
        onChange={v => update('locations', v)}
        placeholder="Ex. Lyon, 33, Île-de-France"
      />
      <Segmented
        label="Télétravail"
        value={draft.remote}
        options={REMOTE_OPTIONS}
        onChange={v => update('remote', v)}
      />
    </div>
  </ProfileRow>
)

export function ContractField({ draft, update }: FieldProps) {
  const toggle = (type: ContractType) =>
    update(
      'contractTypes',
      draft.contractTypes.includes(type) ? draft.contractTypes.filter(t => t !== type) : [...draft.contractTypes, type],
    )
  return (
    <ProfileRow index={5} title="Contrat" hint="Aucun choix = tous les contrats.">
      <div className="flex flex-wrap gap-1.5">
        {CONTRACT_TYPES.map(type => (
          <Tag key={type} selected={draft.contractTypes.includes(type)} onClick={() => toggle(type)}>
            {type}
          </Tag>
        ))}
      </div>
    </ProfileRow>
  )
}

export const SeniorityField = ({ draft, update }: FieldProps) => (
  <ProfileRow index={6} title="Niveau" hint="Comparé au niveau demandé par l'offre.">
    <Segmented
      label="Niveau"
      value={draft.seniority ?? 'none'}
      options={SENIORITY_OPTIONS}
      onChange={v => update('seniority', v === 'none' ? null : v)}
    />
  </ProfileRow>
)

export const SalaryField = ({ draft, update }: FieldProps) => (
  <ProfileRow
    index={7}
    title="Salaire minimum"
    hint="Brut annuel. Les offres sans salaire affiché ne sont pas pénalisées."
  >
    <div className="flex items-center gap-2">
      <div className="w-28">
        <TextField
          type="number"
          inputMode="numeric"
          min={0}
          aria-label="Salaire minimum en milliers d'euros"
          placeholder="40"
          value={draft.salaryMin ? Math.round(draft.salaryMin / 1000) : ''}
          onChange={e => update('salaryMin', e.target.value ? Number(e.target.value) * 1000 : null)}
        />
      </div>
      <span className="text-fg-2">k€ par an</span>
    </div>
  </ProfileRow>
)

export const ExclusionsField = ({ draft, update }: FieldProps) => (
  <ProfileRow index={8} title="Exclusions" hint="Les offres concernées disparaissent des nouvelles.">
    <div className="space-y-4">
      <ChipInput
        label="Mots exclus"
        values={draft.excludedKeywords}
        onChange={v => update('excludedKeywords', v)}
        placeholder="Mots dans l'intitulé : stage, commercial…"
      />
      <ChipInput
        label="Entreprises exclues"
        values={draft.excludedCompanies}
        onChange={v => update('excludedCompanies', v)}
        placeholder="Entreprises à ne plus voir"
      />
    </div>
  </ProfileRow>
)
