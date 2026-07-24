'use client'

type DeleteRequestButtonProps = {
  requestId: string
  action: (formData: FormData) => Promise<void>
}

export default function DeleteRequestButton({
  requestId,
  action,
}: DeleteRequestButtonProps) {
  return (
    <form
      action={action}
      onSubmit={(event) => {
        const confirmed = window.confirm(
          'Poistetaanko tämä markkinointitoive pysyvästi? Myös siihen liittyvä keskustelu poistetaan.'
        )

        if (!confirmed) {
          event.preventDefault()
        }
      }}
    >
      <input
        type="hidden"
        name="request_id"
        value={requestId}
      />

      <button
        className="button danger"
        type="submit"
      >
        Poista
      </button>
    </form>
  )
}