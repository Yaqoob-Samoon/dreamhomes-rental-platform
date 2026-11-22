import { Link } from 'react-router-dom';

/**
 * Custom illustration (no external asset) used for both the fetch-error
 * state and, via ErrorBoundary, any render-time crash on this page.
 */
const BrokenHouseIllustration = () => (
  <svg
    width="120"
    height="120"
    viewBox="0 0 120 120"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <circle cx="60" cy="60" r="56" className="fill-red-50" />
    <path
      d="M30 62 L60 36 L90 62"
      stroke="currentColor"
      className="text-red-300"
      strokeWidth="4"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
    <path
      d="M38 56 V86 H82 V56"
      stroke="currentColor"
      className="text-red-300"
      strokeWidth="4"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
    <path
      d="M53 86 V70 H67 V86"
      stroke="currentColor"
      className="text-red-400"
      strokeWidth="4"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
    <path
      d="M50 46 L70 66 M70 46 L50 66"
      stroke="currentColor"
      className="text-red-500"
      strokeWidth="4"
      strokeLinecap="round"
    />
  </svg>
);

const ErrorState = ({
  title = 'Something went wrong',
  message = 'We couldn\u2019t load this property. Please try again.',
  onRetry,
}) => (
  <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-6 py-16 max-w-md mx-auto">
    <BrokenHouseIllustration />
    <h2 className="mt-6 text-lg font-semibold text-slate-900">{title}</h2>
    <p className="mt-2 text-slate-500 text-[15px] leading-relaxed">{message}</p>
    <div className="mt-6 flex items-center gap-4">
      {onRetry && (
        <button
          onClick={onRetry}
          className="text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 transition-colors px-5 py-2.5 rounded-xl"
        >
          Try again
        </button>
      )}
      <Link
        to="/properties"
        className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline"
      >
        Return to search
      </Link>
    </div>
  </div>
);

export default ErrorState;