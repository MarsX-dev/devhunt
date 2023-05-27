type InputFormProp = {
  id?: string
  style?: string
  type: string
  label?: string
  placeHolder: string
  name?: string
  rows?: number
  cols?: number
  size?: string
  onChange?: (e: React.ChangeEvent<HTMLInputElement> | React.ChangeEvent<HTMLTextAreaElement>) => void
}

export default ({
  id,
  placeHolder,
  type,
  label,
  onChange,
  name,
  size = '',
  style,
  rows = 5,
  cols = 30,
}: InputFormProp) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement> | React.ChangeEvent<HTMLTextAreaElement>) => {
    if (onChange) {
      onChange(e)
    }
  }
  return (
    <div className={`c-input-form flex flex-col gap-1 ${size}`}>
      {label && <label className="text-white text-sm font-medium ">{label}</label>}

      {type === 'textarea' ? (
        <textarea
          placeholder={placeHolder}
          name={name}
          onChange={handleChange}
          id={id}
          rows={rows}
          cols={cols}
          className={` px-3 py-3 ${style} mt-2 bg-slate-800/70 hover:bg-slate-800/40 focus:bg-slate-800/40 text-sm text-slate-500 placeholder-slate-500 outline-none border border-slate-800 focus:border-slate-600 shadow-sm rounded-lg duration-200`}
        ></textarea>
      ) : (
        <input
          type={type}
          name={name}
          placeholder={placeHolder}
          onChange={handleChange}
          id={id}
          className={` px-3 py-3 ${style} mt-2 bg-slate-800/70 hover:bg-slate-800/40 focus:bg-slate-800/40 text-sm text-slate-500 placeholder-slate-500 outline-none border border-slate-800 focus:border-slate-600 shadow-sm rounded-lg duration-200`}
        ></input>
      )}
    </div>
  )
}
