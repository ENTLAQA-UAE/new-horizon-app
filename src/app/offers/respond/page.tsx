"use client"

import { Suspense, useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { CheckCircle, XCircle, Loader2, AlertTriangle } from "lucide-react"

function OfferRespondContent() {
  const searchParams = useSearchParams()
  const token = searchParams.get("token")
  const action = searchParams.get("action")

  const [state, setState] = useState<"loading" | "success" | "error" | "already">("loading")
  const [resultStatus, setResultStatus] = useState<string>("")
  const [jobTitle, setJobTitle] = useState<string>("")
  const [errorMessage, setErrorMessage] = useState<string>("")

  useEffect(() => {
    if (!token || !action) {
      setState("error")
      setErrorMessage("Invalid link. Missing required parameters.")
      return
    }

    if (action !== "accept" && action !== "decline") {
      setState("error")
      setErrorMessage("Invalid action in the link.")
      return
    }

    // Call the API to process the response
    fetch("/api/offers/respond", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, action }),
    })
      .then(async (res) => {
        const data = await res.json()
        if (res.ok) {
          setState("success")
          setResultStatus(data.status)
          setJobTitle(data.jobTitle || "")
        } else if (res.status === 409 && data.alreadyResponded) {
          setState("already")
          setResultStatus(data.status)
        } else {
          setState("error")
          setErrorMessage(data.error || "Something went wrong.")
        }
      })
      .catch(() => {
        setState("error")
        setErrorMessage("Network error. Please try again.")
      })
  }, [token, action])

  return (
    <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
      {state === "loading" && (
        <>
          <Loader2 className="h-12 w-12 animate-spin text-blue-500 mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-gray-900 mb-2">
            Processing your response...
          </h1>
          <p className="text-gray-500">Please wait a moment.</p>
        </>
      )}

      {state === "success" && resultStatus === "accepted" && (
        <>
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Offer Accepted!
          </h1>
          {jobTitle && (
            <p className="text-lg text-gray-600 mb-4">{jobTitle}</p>
          )}
          <p className="text-gray-500">
            Congratulations! The hiring team has been notified of your acceptance.
            They will be in touch with next steps.
          </p>
        </>
      )}

      {state === "success" && resultStatus === "declined" && (
        <>
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircle className="h-8 w-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Offer Declined
          </h1>
          {jobTitle && (
            <p className="text-lg text-gray-600 mb-4">{jobTitle}</p>
          )}
          <p className="text-gray-500">
            The hiring team has been notified. We wish you the best in your career.
          </p>
        </>
      )}

      {state === "already" && (
        <>
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="h-8 w-8 text-yellow-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Already Responded
          </h1>
          <p className="text-gray-500">
            This offer has already been <strong>{resultStatus}</strong>. No further action is needed.
          </p>
        </>
      )}

      {state === "error" && (
        <>
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="h-8 w-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Something Went Wrong
          </h1>
          <p className="text-gray-500">{errorMessage}</p>
        </>
      )}
    </div>
  )
}

export default function OfferRespondPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <Suspense
        fallback={
          <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
            <Loader2 className="h-12 w-12 animate-spin text-blue-500 mx-auto mb-4" />
            <h1 className="text-xl font-semibold text-gray-900 mb-2">
              Loading...
            </h1>
          </div>
        }
      >
        <OfferRespondContent />
      </Suspense>
    </div>
  )
}
