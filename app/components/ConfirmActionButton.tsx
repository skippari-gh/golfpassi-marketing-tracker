'use client'

type ConfirmActionButtonProps = {
  action: (
    formData: FormData
  ) => void | Promise<void>
  itemId: string
  fieldName: string
  label: string
  confirmMessage: string
  formClassName?: string
  buttonClassName?: string
}

export default function ConfirmActionButton({
  action,
  itemId,
  fieldName,
  label,
  confirmMessage,
  formClassName,
  buttonClassName = 'button danger',
}: ConfirmActionButtonProps) {
  return (
    <form
      action={action}
      className={formClassName}
      onSubmit={(event) => {
        const confirmed = window.confirm(
          confirmMessage
        )

        if (!confirmed) {
          event.preventDefault()
        }
      }}
    >
      <input
        type="hidden"
        name={fieldName}
        value={itemId}
      />

      <button
        className={buttonClassName}
        type="submit"
      >
        {label}
      </button>
    </form>
  )
}
