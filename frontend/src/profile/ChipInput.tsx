import { useState, type KeyboardEvent } from 'react'
import { Tag } from '../shared/ui/Tag'
import { TextField } from '../shared/ui/TextField'

interface ChipInputProps {
  values: string[]
  onChange: (values: string[]) => void
  placeholder: string
  label: string
}

export function ChipInput({ values, onChange, placeholder, label }: ChipInputProps) {
  const { text, setText, add, onKeyDown } = useChipTyping(values, onChange)
  return (
    <div className="space-y-2">
      {values.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {values.map(value => (
            <Tag key={value} onRemove={() => onChange(values.filter(v => v !== value))}>
              {value}
            </Tag>
          ))}
        </div>
      )}
      <TextField
        aria-label={label}
        value={text}
        placeholder={placeholder}
        onChange={e => setText(e.target.value)}
        onKeyDown={onKeyDown}
        onBlur={() => text.trim() && add(text)}
      />
    </div>
  )
}

// Entrée ou virgule ajoute la valeur, retour arrière dans le champ vide retire la dernière
function useChipTyping(values: string[], onChange: (values: string[]) => void) {
  const [text, setText] = useState('')
  const add = (raw: string) => {
    const known = values.map(v => v.toLowerCase())
    const additions = raw
      .split(',')
      .map(v => v.trim())
      .filter(v => v && !known.includes(v.toLowerCase()))
    if (additions.length) onChange([...values, ...additions])
    setText('')
  }
  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if ((event.key === 'Enter' || event.key === ',') && text.trim()) {
      event.preventDefault()
      add(text)
    } else if (event.key === 'Backspace' && !text && values.length) {
      onChange(values.slice(0, -1))
    }
  }
  return { text, setText, add, onKeyDown }
}
