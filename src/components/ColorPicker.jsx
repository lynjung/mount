import { useState } from 'react'

export const PALETTES = {
  'Forest & Nature': ['#0E1F1A','#1A3D30','#2A5C48','#2D6A4F','#52B788','#95D5B2','#B7E4C7','#D8F3DC'],
  'Ocean & Sky':     ['#023E8A','#0077B6','#0096C7','#00B4D8','#48CAE4','#4361EE','#4CC9F0','#90E0EF'],
  'Warm & Earthy':   ['#7F4F24','#936639','#B08968','#DDA15E','#E76F51','#F4A261','#E9C46A','#FEFAE0'],
  'Bold & Vivid':    ['#9B2226','#AE2012','#E63946','#C77DFF','#7B2FBE','#D4537E','#FF70A6','#FF9EBB'],
  'Neutral & Stone': ['#212529','#343A40','#495057','#6C757D','#ADB5BD','#6D6875','#B5838D','#E5989B'],
}

const HEX_RE = /^#[0-9A-Fa-f]{6}$/

export function ColorPicker({ value, onChange }) {
  const [hex, setHex] = useState(value || '#1A3D30')
  const [hexInput, setHexInput] = useState(value || '#1A3D30')
  const [hexError, setHexError] = useState(false)

  const pick = (color) => {
    setHex(color)
    setHexInput(color)
    setHexError(false)
    onChange(color)
  }

  const handleHexChange = (e) => {
    const val = e.target.value
    setHexInput(val)
    if (HEX_RE.test(val)) {
      setHexError(false)
      setHex(val)
      onChange(val)
    } else {
      setHexError(true)
    }
  }

  return (
    <div>
      {/* Swatches — 5 rows of 8, no group labels */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
        {Object.values(PALETTES).map((row, ri) => (
          <div key={ri} style={{ display: 'flex', gap: 6 }}>
            {row.map(color => (
              <div
                key={color}
                onClick={() => pick(color)}
                style={{
                  width: 28, height: 28, borderRadius: 6, background: color,
                  cursor: 'pointer', flexShrink: 0,
                  border: hex === color
                    ? `2.5px solid ${color}`
                    : '2.5px solid transparent',
                  outline: hex === color ? '2px solid #0E1F1A' : 'none',
                  outlineOffset: 1,
                }}
              />
            ))}
          </div>
        ))}
      </div>

      {/* Hex input */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <div style={{ width: 32, height: 32, borderRadius: 6, background: HEX_RE.test(hexInput) ? hexInput : hex, flexShrink: 0, border: '1px solid #D8F3DC' }} />
        <input
          value={hexInput}
          onChange={handleHexChange}
          placeholder="#1A3D30"
          maxLength={7}
          style={{
            flex: 1, padding: '8px 12px', fontSize: 13,
            border: `1px solid ${hexError ? '#E63946' : '#D8F3DC'}`,
            borderRadius: 10, background: '#F8FAF9', color: '#0E1F1A',
            fontFamily: 'monospace', outline: 'none',
          }}
        />
      </div>

      {/* Live preview card */}
      <div style={{ borderRadius: 10, overflow: 'hidden', border: '1px solid #E8F5F0' }}>
        <div style={{ height: 4, background: hex }} />
        <div style={{ padding: '10px 14px', background: '#fff' }}>
          <div style={{ fontSize: 10, color: '#7A9E8E', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 }}>Preview</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#0E1F1A' }}>Account Name</div>
          <div style={{ fontSize: 12, color: '#7A9E8E', marginTop: 2 }}>$1,234.56</div>
        </div>
      </div>
    </div>
  )
}
