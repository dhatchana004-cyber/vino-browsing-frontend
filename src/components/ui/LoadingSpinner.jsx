export default function LoadingSpinner({ text = 'Loading...' }) {
  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-4 animate-in">
      <div className="w-10 h-10 border-4 border-brand-100 border-t-brand-600 rounded-full animate-spin"></div>
      <p className="text-slate-500 font-medium text-sm animate-pulse">{text}</p>
    </div>
  );
}
