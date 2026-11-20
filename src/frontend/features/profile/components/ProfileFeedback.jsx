export default function ProfileFeedback({ errorMsg, successMsg }) {
  return (
    <>
      {errorMsg ? (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMsg}
        </div>
      ) : null}

      {successMsg ? (
        <div className="mb-6 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {successMsg}
        </div>
      ) : null}
    </>
  );
}