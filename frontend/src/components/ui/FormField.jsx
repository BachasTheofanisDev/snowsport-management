/**
 * Πεδίο φόρμας: label + input ή select.
 * Props:
 *  - label: string
 *  - type: 'text' | 'email' | 'password' | 'date' | 'number' | 'textarea' | 'select'
 *  - value, onChange: controlled
 *  - required, placeholder, min, rows, disabled
 *  - options: [{ value, label }] — για select
 *  - children: εναλλακτικά για custom select options
 */
function FormField({ label, type = 'text', value, onChange, required, placeholder, min, rows = 4, disabled, options, children, extra }) {
  return (
    <div className="form-group">
      {label && (
        <label className="form-label">
          {label}
          {extra}
        </label>
      )}
      {type === 'textarea' ? (
        <textarea className="form-input" rows={rows} value={value} onChange={onChange}
          placeholder={placeholder} required={required} disabled={disabled} />
      ) : type === 'select' ? (
        <select className="form-select" value={value} onChange={onChange} disabled={disabled} required={required}>
          {options
            ? options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)
            : children}
        </select>
      ) : (
        <input className="form-input" type={type} value={value} onChange={onChange}
          placeholder={placeholder} required={required} min={min} disabled={disabled} />
      )}
    </div>
  )
}

export default FormField
