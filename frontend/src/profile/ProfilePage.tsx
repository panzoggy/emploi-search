import { AnimatePresence, motion } from 'framer-motion'
import { AlertCircle } from 'lucide-react'
import { Button } from '../shared/ui/Button'
import { Skeleton } from '../shared/ui/Skeleton'
import { CvDropzone } from './CvDropzone'
import { CvPreview } from './CvPreview'
import { CvSuggestionsPanel } from './CvSuggestionsPanel'
import {
  ContractField,
  ExclusionsField,
  PlacesField,
  SalaryField,
  SeniorityField,
  SkillsField,
  TitlesField,
  type FieldProps,
} from './ProfileFields'
import { ProfileRow } from './ProfileRow'
import { useProfile } from './useProfile'
import type { Profile } from './types'

export function ProfilePage() {
  const { profile, draft, dirty, saving, error, update, save, cv } = useProfile()
  if (error) return <LoadError message={error} />
  if (!profile || !draft) return <ProfileSkeleton />
  const fields: FieldProps = { draft, update }
  return (
    <div className="pb-32">
      <div className="border-b border-rule px-4 py-6 lg:px-6">
        <h1 className="text-2xl font-semibold tracking-title">Profil</h1>
        <p className="mt-1 max-w-xl text-sm text-fg-2">
          Ce que tu cherches. Plus c'est précis, mieux les offres sont classées ; un critère vide est ignoré.
        </p>
      </div>
      <div className="px-4 lg:px-6">
        <CvField profile={profile} cv={cv} {...fields} />
        <TitlesField {...fields} />
        <SkillsField {...fields} />
        <PlacesField {...fields} />
        <ContractField {...fields} />
        <SeniorityField {...fields} />
        <SalaryField {...fields} />
        <ExclusionsField {...fields} />
      </div>
      <SaveBar visible={dirty} saving={saving} onSave={() => void save()} />
    </div>
  )
}

type CvState = ReturnType<typeof useProfile>['cv']

function CvField({ profile, cv, draft, update }: FieldProps & { profile: Profile; cv: CvState }) {
  const addToList = (key: 'targetTitles' | 'skills' | 'locations', values: string[]) =>
    update(key, [...draft[key], ...values.filter(v => !draft[key].includes(v))])
  return (
    <ProfileRow index={1} title="CV" hint="Facultatif, mais c'est ce qui donne le meilleur classement.">
      <CvDropzone
        profile={profile}
        uploading={cv.uploading}
        onFile={f => void cv.upload(f)}
        onRemove={() => void cv.remove()}
      />
      <CvPreview profile={profile} />
      {cv.suggestions && (
        <CvSuggestionsPanel
          suggestions={cv.suggestions}
          draft={draft}
          onAdd={addToList}
          onSeniority={s => update('seniority', s)}
        />
      )}
    </ProfileRow>
  )
}

function SaveBar({ visible, saving, onSave }: { visible: boolean; saving: boolean; onSave: () => void }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          transition={{ duration: 0.16, ease: [0.4, 0, 0.2, 1] }}
          className="fixed inset-x-0 bottom-0 z-20 border-t border-rule-strong bg-canvas"
        >
          <div className="flex items-center justify-end gap-4 px-4 py-3 lg:px-6">
            <span className="text-sm text-fg-2">Modifications non enregistrées</span>
            <Button variant="primary" size="sm" loading={saving} onClick={onSave}>
              Enregistrer
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

const LoadError = ({ message }: { message: string }) => (
  <p className="flex items-center gap-2 px-6 py-10 text-danger">
    <AlertCircle className="h-4 w-4" aria-hidden /> {message}
  </p>
)

const ProfileSkeleton = () => (
  <div className="space-y-4 px-6 py-10">
    <Skeleton className="h-10 w-48" />
    <Skeleton className="h-64" />
  </div>
)
