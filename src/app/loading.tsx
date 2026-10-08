export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] w-full">
      <div className="relative flex items-center justify-center w-16 h-16">
        <div className="absolute w-full h-full border-4 border-blue-100 rounded-full"></div>
        <div className="absolute w-full h-full border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
      </div>
      <p className="mt-4 text-blue-600 font-medium text-sm animate-pulse">Loading module...</p>
    </div>
  );
}
